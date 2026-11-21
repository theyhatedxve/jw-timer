package expo.modules.backupcrypto

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

private const val MAX_BYTES = 8 * 1024 * 1024
private val MAGIC = "JWTBKP01".toByteArray(Charsets.US_ASCII)

class BackupCryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BackupCrypto")

    AsyncFunction("encrypt") { plaintext: String, password: String ->
      val bytes = plaintext.toByteArray(Charsets.UTF_8)

      try {
        require(bytes.isNotEmpty() && bytes.size <= MAX_BYTES)

        val random = SecureRandom()
        val salt = ByteArray(16).also { random.nextBytes(it) }
        val nonce = ByteArray(12).also { random.nextBytes(it) }
        val header = MAGIC + salt + nonce
        val key = deriveKey(password, salt)

        try {
          val cipher = Cipher.getInstance("AES/GCM/NoPadding")
          cipher.init(
            Cipher.ENCRYPT_MODE,
            SecretKeySpec(key, "AES"),
            GCMParameterSpec(128, nonce)
          )
          cipher.updateAAD(header)
          header + cipher.doFinal(bytes)
        } finally {
          key.fill(0)
        }
      } finally {
        bytes.fill(0)
      }
    }

    AsyncFunction("decrypt") { encrypted: ByteArray, password: String ->
      require(encrypted.size in 53..(MAX_BYTES + 52))
      require(encrypted.copyOfRange(0, 8).contentEquals(MAGIC))

      val header = encrypted.copyOfRange(0, 36)
      val salt = encrypted.copyOfRange(8, 24)
      val nonce = encrypted.copyOfRange(24, 36)
      val key = deriveKey(password, salt)

      try {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(
          Cipher.DECRYPT_MODE,
          SecretKeySpec(key, "AES"),
          GCMParameterSpec(128, nonce)
        )
        cipher.updateAAD(header)

        val plaintext = cipher.doFinal(
          encrypted,
          36,
          encrypted.size - 36
        )

        try {
          require(plaintext.size <= MAX_BYTES)
          plaintext.toString(Charsets.UTF_8)
        } finally {
          plaintext.fill(0)
        }
      } finally {
        key.fill(0)
      }
    }
  }

  private fun deriveKey(password: String, salt: ByteArray): ByteArray {
    require(password.length in 12..128)

    val characters = password.toCharArray()
    val specification = PBEKeySpec(
      characters,
      salt,
      600_000,
      256
    )

    return try {
      SecretKeyFactory
        .getInstance("PBKDF2WithHmacSHA256")
        .generateSecret(specification)
        .encoded
    } finally {
      characters.fill('\u0000')
      specification.clearPassword()
    }
  }
}