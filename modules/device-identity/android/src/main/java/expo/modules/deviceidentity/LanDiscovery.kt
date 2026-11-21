package expo.modules.deviceidentity

import android.content.Context
import android.content.pm.PackageManager
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import java.net.Inet4Address
import java.util.ArrayDeque
import java.util.concurrent.atomic.AtomicLong
import org.json.JSONObject

private const val SERVICE_TYPE = "_jwtimer._tcp."

/** Untrusted endpoint hints only. Mutual TLS and application grants remain authoritative. */
@Suppress("DEPRECATION")
internal class LanDiscovery(
  private val context: Context,
  private val emit: (String, Map<String, Any>) -> Unit
) {
  companion object {
    @Volatile private var restartRequired = false
  }
  private val manager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
  private val main = Handler(Looper.getMainLooper())
  private var generation = 0L
  private val generations = AtomicLong(0)
  private var advertisementGeneration = 0L
  private var listener: NsdManager.DiscoveryListener? = null
  private var registration: NsdManager.RegistrationListener? = null
  private val queue = ArrayDeque<NsdServiceInfo>()
  private val seen = mutableSetOf<String>()
  private var activeResolve: Any? = null
  private var retiringResolve: Any? = null
  private var cancelResolve: (() -> Unit)? = null
  private var multicast: WifiManager.MulticastLock? = null

  private fun checkAccess() {
    if (Build.VERSION.SDK_INT >= 37 && context.applicationInfo.targetSdkVersion >= 37) {
      require(context.checkSelfPermission("android.permission.ACCESS_LOCAL_NETWORK") == PackageManager.PERMISSION_GRANTED)
    }
  }

  fun advertise(scope: String, fingerprint: String) {
    checkAccess()
    main.post {
      stopAdvertisementOnMain()
      val epoch = advertisementGeneration
      val callback = object : NsdManager.RegistrationListener {
        override fun onServiceRegistered(info: NsdServiceInfo) {
          if (epoch != advertisementGeneration) runCatching { manager.unregisterService(this) }
        }
        override fun onRegistrationFailed(info: NsdServiceInfo, code: Int) {
          if (registration === this) registration = null
        }
        override fun onServiceUnregistered(info: NsdServiceInfo) = Unit
        override fun onUnregistrationFailed(info: NsdServiceInfo, code: Int) = Unit
      }
      registration = callback
      val info = NsdServiceInfo().apply {
        serviceName = "JWTimer-" + lanToken().take(16)
        serviceType = SERVICE_TYPE
        port = 49373
        setAttribute("fp", fingerprint)
        setAttribute("scope", scope)
        setAttribute("version", "1")
      }
      runCatching { manager.registerService(info, NsdManager.PROTOCOL_DNS_SD, callback) }
        .onFailure { if (registration === callback) registration = null }
    }
  }

  fun start(): Long {
    checkAccess()
    val epoch = generations.incrementAndGet()
    main.post {
      stopDiscoveryOnMain()
      generation = epoch
      if (restartRequired) {
        stopDiscoveryOnMain("failed")
        return@post
      }
      try {
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        multicast = wifi.createMulticastLock("jw-timer-discovery").apply {
          setReferenceCounted(false); acquire()
        }
        val callback = object : NsdManager.DiscoveryListener {
          override fun onDiscoveryStarted(type: String) = Unit
          override fun onDiscoveryStopped(type: String) {
            main.post { if (epoch == generation) stopDiscoveryOnMain() }
          }
          override fun onStartDiscoveryFailed(type: String, code: Int) {
            main.post { if (epoch == generation) stopDiscoveryOnMain("failed") }
          }
          override fun onStopDiscoveryFailed(type: String, code: Int) = Unit
          override fun onServiceLost(info: NsdServiceInfo) {
            main.post { if (epoch == generation) queue.removeAll { it.serviceName == info.serviceName } }
          }
          override fun onServiceFound(info: NsdServiceInfo) {
            main.post {
              if (epoch != generation || info.serviceType != SERVICE_TYPE || seen.size >= 32) return@post
              if (seen.add(info.serviceName)) { queue.add(info); resolveNext(epoch) }
            }
          }
        }
        listener = callback
        manager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, callback)
        main.postDelayed({ if (epoch == generation) stopDiscoveryOnMain() }, 300_000)
      } catch (_: Exception) { stopDiscoveryOnMain("failed") }
    }
    return epoch
  }

  private fun resolveNext(epoch: Long) {
    if (epoch != generation || activeResolve != null || retiringResolve != null || queue.isEmpty()) return
    val service = queue.removeFirst()
    val resolveId = Any()
    activeResolve = resolveId
    val timeout = Runnable { if (epoch == generation && activeResolve === resolveId) stopDiscoveryOnMain("failed") }
    main.postDelayed(timeout, 5_000)
    if (Build.VERSION.SDK_INT >= 34) {
      resolveModern(service, epoch, resolveId, timeout)
      return
    }
    // Old Android cannot safely cancel an outstanding resolve. Surface a terminal failure
    // on timeout/stop and require process restart instead of silently blocking later starts.
    cancelResolve = { restartRequired = true }
    val callback = object : NsdManager.ResolveListener {
      override fun onResolveFailed(info: NsdServiceInfo, code: Int) = finish(null)
      override fun onServiceResolved(info: NsdServiceInfo) = finish(info)
      private fun finish(info: NsdServiceInfo?) {
        main.post {
          if (activeResolve !== resolveId) return@post
          main.removeCallbacks(timeout)
          activeResolve = null
          cancelResolve = null
          if (epoch == generation && info != null) runCatching { publish(info) }
          if (listener != null) resolveNext(generation)
        }
      }
    }
    try { manager.resolveService(service, callback) }
    catch (_: Exception) {
      main.removeCallbacks(timeout); activeResolve = null; cancelResolve = null
      stopDiscoveryOnMain("failed")
    }
  }

  @android.annotation.TargetApi(34)
  private fun resolveModern(service: NsdServiceInfo, epoch: Long, resolveId: Any, timeout: Runnable) {
    val retirementTimeout = Runnable {
      if (retiringResolve === resolveId) {
        restartRequired = true
        retiringResolve = null
        if (generation != 0L) stopDiscoveryOnMain("failed")
        else runCatching { emit("onLanDiscoveryState", mapOf("generation" to epoch,
          "state" to "failed", "reason" to "restartRequired")) }
      }
    }
    val callback = object : NsdManager.ServiceInfoCallback {
      override fun onServiceInfoCallbackRegistrationFailed(code: Int) {
        if (epoch != generation || activeResolve !== resolveId) return
        main.removeCallbacks(timeout)
        activeResolve = null; cancelResolve = null
        stopDiscoveryOnMain("failed")
      }
      override fun onServiceInfoCallbackUnregistered() {
        if (retiringResolve !== resolveId) return
        main.removeCallbacks(retirementTimeout)
        retiringResolve = null
        if (listener != null) resolveNext(generation)
      }
      override fun onServiceLost() = Unit
      override fun onServiceUpdated(info: NsdServiceInfo) {
        if (epoch != generation || activeResolve !== resolveId) return
        main.removeCallbacks(timeout)
        activeResolve = null
        val cancel = cancelResolve
        cancelResolve = null
        cancel?.invoke()
        if (restartRequired) { stopDiscoveryOnMain("failed"); return }
        runCatching { publish(info) }
        resolveNext(epoch)
      }
    }
    cancelResolve = {
      retiringResolve = resolveId
      main.postDelayed(retirementTimeout, 5_000)
      runCatching { manager.unregisterServiceInfoCallback(callback) }
        .onFailure {
          main.removeCallbacks(retirementTimeout)
          retiringResolve = null
          restartRequired = true
        }
    }
    try {
      manager.registerServiceInfoCallback(service, { command -> main.post(command) }, callback)
    } catch (_: Exception) {
      main.removeCallbacks(timeout)
      activeResolve = null; cancelResolve = null
      stopDiscoveryOnMain("failed")
    }
  }

  private fun publish(info: NsdServiceInfo) {
    checkAccess()
    require(info.port == 49373)
    val address = if (Build.VERSION.SDK_INT >= 34) {
      info.hostAddresses.filterIsInstance<Inet4Address>()
        .firstOrNull { it.isSiteLocalAddress && !it.isLoopbackAddress }
    } else info.host as? Inet4Address
    if (address == null) return
    require(address.isSiteLocalAddress && !address.isLoopbackAddress)
    val attributes = info.attributes
    fun text(key: String): String {
      val bytes = attributes[key] ?: error("Missing metadata")
      require(bytes.size <= 80)
      return String(bytes, Charsets.UTF_8)
    }
    require(text("version") == "1")
    val fingerprint = text("fp")
    val scope = text("scope")
    require(Regex("^sha256:[a-f0-9]{64}$").matches(fingerprint))
    require(Regex("^[a-f0-9]{32}$").matches(scope))
    val endpoint = JSONObject().put("version", 1).put("host", address.hostAddress)
      .put("port", 49373).put("congregationId", scope).put("fingerprint", fingerprint)
    emit("onLanDiscovered", mapOf("code" to endpoint.toString()))
  }

  fun stopDiscovery() { main.post { stopDiscoveryOnMain() } }
  fun stop() { main.post { stopDiscoveryOnMain(); stopAdvertisementOnMain() } }

  private fun stopDiscoveryOnMain(state: String = "stopped") {
    val epoch = generation
    generation = 0L
    val current = listener
    listener = null
    if (current != null) runCatching { manager.stopServiceDiscovery(current) }
    queue.clear(); seen.clear()
    activeResolve = null
    val cancel = cancelResolve
    cancelResolve = null
    cancel?.invoke()
    runCatching { multicast?.release() }; multicast = null
    if (epoch != 0L) runCatching {
      emit("onLanDiscoveryState", mapOf("generation" to epoch,
        "state" to if (restartRequired) "failed" else state,
        "reason" to if (restartRequired) "restartRequired" else state))
    }
  }

  private fun stopAdvertisementOnMain() {
    advertisementGeneration++
    val current = registration
    registration = null
    if (current != null) runCatching { manager.unregisterService(current) }
  }
}
