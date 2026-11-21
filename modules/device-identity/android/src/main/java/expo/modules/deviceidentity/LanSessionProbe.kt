package expo.modules.deviceidentity

import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import android.os.SystemClock
import java.io.DataInputStream
import java.io.DataOutputStream
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.net.SocketTimeoutException
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.security.KeyStore
import java.security.SecureRandom
import java.util.Timer
import java.util.TimerTask
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import javax.net.ssl.SSLServerSocket
import javax.net.ssl.SSLSocket
import org.json.JSONObject

private const val LAN_PORT = 49373
private const val HOST_LIFETIME_MS = 300_000L
private const val SOCKET_TIMEOUT_MS = 5_000
private const val MAX_FRAME_BYTES = 1024
private const val SYNC_FRAME_BYTES = 1_048_576
private val TOKEN = Regex("^[a-f0-9]{64}$")
private val SCOPE = Regex("^[a-f0-9]{32}$")

internal fun lanToken(): String = ByteArray(32).also {
  SecureRandom().nextBytes(it)
}.joinToString("") { "%02x".format(it.toInt() and 0xff) }

private fun validateSessionRequest(
  value: JSONObject,
  nonce: String,
  scope: String
): String {
  val operation = value.get("operation") as? String ?: error("Invalid operation")
  require(value.length() == if (operation == "sync.exchange") 5 else 4)
  require(value.opt("version") == 1)
  require(value.opt("nonce") == nonce)
  require(value.opt("congregationId") == scope)

  require(operation == "session.check" || operation == "schedule.read" || operation == "sync.exchange")
  if (operation == "sync.exchange") require(value.getJSONObject("body").toString().length <= 262_144)

  return operation
}
internal fun checkLanProtocol(): Boolean {
  val nonce = "a".repeat(64)
  val scope = "b".repeat(32)
  val request = JSONObject().put("version", 1).put("operation", "session.check")
    .put("nonce", nonce).put("congregationId", scope)
  validateSessionRequest(request, nonce, scope)
  return listOf(
    JSONObject(request.toString()).put("nonce", "c".repeat(64)),
    JSONObject(request.toString()).put("congregationId", "d".repeat(32)),
    JSONObject(request.toString()).put("version", 2)
  ).all { runCatching { validateSessionRequest(it, nonce, scope) }.isFailure }
}

internal class LanSessionProbe(
  private val context: Context,
  private val emit: (String, Map<String, Any>) -> Unit,
  private val fingerprint: (ByteArray) -> String
) {
  private data class Host(
    val id: String, val server: SSLServerSocket, val scope: String, val until: Long,
    val expiry: Timer
  )
  private data class Wifi(val network: Network, val address: Inet4Address)

    private data class Authorization(
    val allowed: Boolean,
    val schedule: String
  )

  @Volatile private var host: Host? = null
  @Volatile private var clientSocket: Socket? = null
  @Volatile private var activeClientId: String? = null
  private val probing = AtomicBoolean(false)
  private val cancellation = AtomicLong(0)
  private val connections = ConcurrentHashMap<String, SSLSocket>()
  private val pending =
    ConcurrentHashMap<String, CompletableFuture<Authorization>>()
  private val discovery = LanDiscovery(context, emit)

  fun startDiscovery(): Long { wifi(); return discovery.start() }
  fun stopDiscovery() { discovery.stopDiscovery() }

  private fun checkAccess() {
    if (Build.VERSION.SDK_INT >= 37 && context.applicationInfo.targetSdkVersion >= 37) {
      require(context.checkSelfPermission("android.permission.ACCESS_LOCAL_NETWORK") ==
        PackageManager.PERMISSION_GRANTED)
    }
  }

  private fun wifi(): Wifi {
    checkAccess()
    val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    for (network in manager.allNetworks) {
      val capabilities = manager.getNetworkCapabilities(network) ?: continue
      if (!capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue
      val address = manager.getLinkProperties(network)?.linkAddresses
        ?.map { it.address }?.filterIsInstance<Inet4Address>()
        ?.firstOrNull { it.isSiteLocalAddress && !it.isLoopbackAddress } ?: continue
      return Wifi(network, address)
    }
    error("Private Wi-Fi unavailable")
  }

  private fun endpoint(entry: KeyStore.PrivateKeyEntry, scope: String, address: Inet4Address): Map<String, Any> {
    require(SCOPE.matches(scope))
    return mapOf("version" to 1, "host" to address.hostAddress.orEmpty(),
      "port" to LAN_PORT, "congregationId" to scope,
      "fingerprint" to fingerprint(entry.certificate.publicKey.encoded))
  }

  fun describe(entry: KeyStore.PrivateKeyEntry, scope: String): Map<String, Any> =
    endpoint(entry, scope, wifi().address)

  @Synchronized fun start(
    id: String, entry: KeyStore.PrivateKeyEntry, peer: ByteArray, scope: String
  ): Map<String, Any> {
    require(TOKEN.matches(id) && SCOPE.matches(scope) && !probing.get())
    stop()
    val local = wifi()
    val server = pairedTlsContext(entry, peer).serverSocketFactory
      .createServerSocket() as SSLServerSocket
    try {
      server.enabledProtocols = arrayOf("TLSv1.3")
      server.needClientAuth = true
      server.soTimeout = 1000
      server.bind(InetSocketAddress(local.address, LAN_PORT), 4)
      val expiry = Timer("jw-timer-lan-expiry", true)
      val current = Host(id, server, scope, SystemClock.elapsedRealtime() + HOST_LIFETIME_MS, expiry)
      host = current
      discovery.advertise(scope, fingerprint(entry.certificate.publicKey.encoded))
      // Close even a slow client when the foreground hosting lease expires.
      expiry.schedule(object : TimerTask() {
        override fun run() { stop(id) }
      }, HOST_LIFETIME_MS)
      Thread({
        try {
          var attempts = 0
          while (host === current && SystemClock.elapsedRealtime() < current.until && attempts < 4096) {
            val socket = try { server.accept() as SSLSocket }
              catch (_: SocketTimeoutException) { continue }
            attempts++
            connections[id] = socket
            val timeout = object : TimerTask() {
              override fun run() { runCatching { socket.close() } }
            }
            try {
              // SO_TIMEOUT alone permits a peer to trickle bytes indefinitely.
              current.expiry.schedule(timeout, 15_000)
              socket.soTimeout = SOCKET_TIMEOUT_MS
              serve(current, socket)
            } catch (_: Exception) {
              // Invalid, denied, or interrupted connections reveal no records.
            } finally {
              timeout.cancel()
              connections.remove(id, socket)
              runCatching { socket.close() }
            }
          }
        } catch (_: Exception) {
          // Stop closes the listener to interrupt accept.
        } finally { stop(id) }
      }, "jw-timer-lan-probe").apply { isDaemon = true; start() }
      return endpoint(entry, scope, local.address)
    } catch (error: Exception) {
      runCatching { server.close() }
      throw error
    }
  }

    private fun serve(current: Host, socket: SSLSocket) {
    val deadline = SystemClock.elapsedRealtime() + 15_000

    socket.startHandshake()

    val verifiedPeer = fingerprint(
      socket.session.peerCertificates.first().publicKey.encoded
    )
    val nonce = lanToken()

    writeFrame(
      socket,
      JSONObject().put("version", 1).put("nonce", nonce)
    )

    val request = readFrame(socket, SYNC_FRAME_BYTES, true)

    require(
      host === current &&
      SystemClock.elapsedRealtime() < deadline &&
      SystemClock.elapsedRealtime() < current.until
    )

    val operation = validateSessionRequest(
      request, nonce, current.scope
    )
    val ticket = lanToken()
    val decision = CompletableFuture<Authorization>()

    pending[ticket] = decision

    try {
      emit("onLanAuthorize", mapOf(
        "hostId" to current.id,
        "ticket" to ticket,
        "peerFingerprint" to verifiedPeer,
        "congregationId" to current.scope,
        "operation" to operation,
        "body" to if (operation == "sync.exchange") request.getJSONObject("body").toString() else ""
      ))

      val answer = decision.get(if (operation == "sync.exchange") 6L else 3L, TimeUnit.SECONDS)

      require(
        host === current &&
        SystemClock.elapsedRealtime() < deadline &&
        SystemClock.elapsedRealtime() < current.until
      )

      val response = JSONObject()
        .put("version", 1)
        .put("nonce", nonce)
        .put("accepted", answer.allowed)

      if (operation == "schedule.read") {
        response.put(
          "schedule",
          if (answer.allowed) {
            require(answer.schedule.length in 1..65_536)
            strictObject(answer.schedule)
          } else {
            JSONObject.NULL
          }
        )
      }

      if (operation == "sync.exchange") {
        response.put("reply", if (answer.allowed) {
          require(answer.schedule.length in 1..262_144)
          strictObject(answer.schedule)
        } else JSONObject.NULL)
      }

      writeFrame(socket, response, if (operation == "sync.exchange") SYNC_FRAME_BYTES else if (operation == "schedule.read") 262_144 else MAX_FRAME_BYTES)
    } finally {
      pending.remove(ticket)
    }
  }

  fun resolve(
    ticket: String,
    allowed: Boolean,
    schedule: String
  ) {
    require(schedule.length <= 262_144)

    pending.remove(ticket)?.complete(
      Authorization(allowed, if (allowed) schedule else "")
    )
  }

  @Synchronized fun stop(expectedId: String? = null) {
    require(expectedId == null || TOKEN.matches(expectedId))
    val current = host
    if (expectedId != null && current?.id != expectedId) return
    cancellation.incrementAndGet()
    host = null
    discovery.stop()
    current?.expiry?.cancel()
    runCatching { current?.server?.close() }
    connections.values.forEach { runCatching { it.close() } }
    connections.clear()
    pending.values.forEach {
      it.complete(Authorization(false, ""))
    }
    pending.clear()
    runCatching { clientSocket?.close() }
    clientSocket = null
    activeClientId = null
    if (current != null) runCatching { emit("onLanStopped", mapOf("hostId" to current.id)) }
  }

  @Synchronized fun cancelClient(expectedClientId: String) {
    require(TOKEN.matches(expectedClientId))
    if (activeClientId != expectedClientId) return
    activeClientId = null
    runCatching { clientSocket?.close() }
    clientSocket = null
  }

    fun probe(
    entry: KeyStore.PrivateKeyEntry,
    peer: ByteArray,
    code: JSONObject,
    operation: String,
    bodyJSON: String,
    clientId: String
  ): Map<String, Any> {
    require(TOKEN.matches(clientId))
    val generation = synchronized(this) {
      require(host == null && probing.compareAndSet(false, true))
      activeClientId = clientId
      cancellation.get()
    }
    var raw: Socket? = null
    var tls: SSLSocket? = null
    var expiry: Timer? = null
    try {
      require(operation == "session.check" || operation == "schedule.read" || operation == "sync.exchange")
      require(if (operation == "sync.exchange") bodyJSON.length in 1..262_144 else bodyJSON.isEmpty())
      require(code.length() == 5 && code.opt("version") == 1 && code.opt("port") == LAN_PORT)
      val hostAddress = code.get("host") as? String ?: error("Invalid host")
      val octets = hostAddress.split(".")
      require(octets.size == 4 && octets.all {
        it.matches(Regex("^[0-9]{1,3}$")) && it.toInt() in 0..255 && it.toInt().toString() == it
      })
      val address = InetAddress.getByAddress(octets.map { it.toInt().toByte() }.toByteArray())
      require(address is Inet4Address && address.isSiteLocalAddress && !address.isLoopbackAddress)
      val scope = code.get("congregationId") as? String ?: error("Invalid scope")
      require(SCOPE.matches(scope) && code.opt("fingerprint") == fingerprint(peer))
      val local = wifi()
      val connection = Socket()
      raw = connection
      expiry = Timer("jw-timer-lan-client-expiry", true).apply {
        schedule(object : TimerTask() {
          override fun run() { runCatching { connection.close() } }
        }, 15_000)
      }
      synchronized(this) {
        require(cancellation.get() == generation && activeClientId == clientId)
        clientSocket = raw
      }
      local.network.bindSocket(raw)
      raw.connect(InetSocketAddress(address, LAN_PORT), SOCKET_TIMEOUT_MS)
      tls = pairedTlsContext(entry, peer).socketFactory
        .createSocket(raw, hostAddress, LAN_PORT, true) as SSLSocket
      synchronized(this) {
        require(cancellation.get() == generation && activeClientId == clientId)
        clientSocket = tls
      }
      tls.enabledProtocols = arrayOf("TLSv1.3")
      tls.soTimeout = SOCKET_TIMEOUT_MS
      tls.startHandshake()
      val verifiedPeer = fingerprint(tls.session.peerCertificates.first().publicKey.encoded)
      val hello = readFrame(tls)
      require(hello.length() == 2 && hello.opt("version") == 1)
      val nonce = hello.get("nonce") as? String ?: error("Invalid nonce")
      require(TOKEN.matches(nonce) && cancellation.get() == generation && activeClientId == clientId)
      val request = JSONObject().put("version", 1).put("operation", operation)
        .put("nonce", nonce).put("congregationId", scope)
      if (operation == "sync.exchange") request.put("body", strictObject(bodyJSON))
      writeFrame(tls, request, if (operation == "sync.exchange") SYNC_FRAME_BYTES else MAX_FRAME_BYTES)
      tls.soTimeout = if (operation == "sync.exchange") 8_000 else SOCKET_TIMEOUT_MS
      val response = readFrame(tls, if (operation == "sync.exchange") SYNC_FRAME_BYTES else if (operation == "schedule.read") 262_144 else MAX_FRAME_BYTES)
      val expectedFields = if (operation == "schedule.read" || operation == "sync.exchange") 4 else 3
      require(response.length() == expectedFields && response.opt("version") == 1 && response.opt("nonce") == nonce)
      val accepted = response.get("accepted") as? Boolean ?: error("Invalid response")
      require(cancellation.get() == generation && activeClientId == clientId)
      if (operation == "sync.exchange") {
        require(response.has("reply"))
        if (!accepted) require(response.isNull("reply"))
        val reply = if (accepted) response.getJSONObject("reply").toString().also {
          require(it.length <= 262_144)
        } else ""
        return mapOf("peerFingerprint" to verifiedPeer, "accepted" to accepted, "reply" to reply)
      }
      if (operation == "schedule.read") {
        require(response.has("schedule"))
        if (!accepted) require(response.isNull("schedule"))
        val schedule = if (accepted) {
          response.getJSONObject("schedule").toString().also {
            require(it.length <= 65_536)
          }
        } else ""
        return mapOf(
          "peerFingerprint" to verifiedPeer,
          "accepted" to accepted,
          "schedule" to schedule
        )
      }
      return mapOf("peerFingerprint" to verifiedPeer, "accepted" to accepted)
    } finally {
      expiry?.cancel()
      runCatching { tls?.close() }
      runCatching { raw?.close() }
      synchronized(this) {
        if (activeClientId == clientId) { clientSocket = null; activeClientId = null }
        probing.set(false)
      }
    }
  }

  private fun readFrame(socket: SSLSocket, maximum: Int = MAX_FRAME_BYTES, request: Boolean = false): JSONObject {
    val input = DataInputStream(socket.inputStream)
    val length = input.readInt()
    require(length in 1..maximum)
    val bytes = ByteArray(length)
    input.readFully(bytes)
    val text = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
      .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString()
    val value = strictObject(text)
    if (request && value.opt("operation") != "sync.exchange") require(length <= MAX_FRAME_BYTES)
    return value
  }

  private fun writeFrame(socket: SSLSocket, value: JSONObject, maximum: Int = MAX_FRAME_BYTES) {
    val bytes = value.toString().toByteArray(Charsets.UTF_8)
    require(bytes.size in 1..maximum)
    DataOutputStream(socket.outputStream).apply { writeInt(bytes.size); write(bytes); flush() }
  }
}
