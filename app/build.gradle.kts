import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.floatingtask"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.example.floatingtask"
        minSdk = 26
        targetSdk = 37
        versionCode = 4
        versionName = "1.1.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        val localProperties = Properties()
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.exists()) {
            localProperties.load(localPropertiesFile.inputStream())
        }

        val appId = localProperties.getProperty("ADMOB_APP_ID") ?: ""
        val bannerId = localProperties.getProperty("ADMOB_BANNER_UNIT_ID") ?: ""
        val rewardedId = localProperties.getProperty("ADMOB_REWARDED_UNIT_ID") ?: ""
        val premiumHash = localProperties.getProperty("PREMIUM_CODE_HASH") ?: ""
        val premiumSalt = localProperties.getProperty("PREMIUM_CODE_SALT") ?: ""

        manifestPlaceholders["ADMOB_APP_ID"] = appId
        resValue("string", "admob_banner_unit_id", bannerId)
        buildConfigField("String", "ADMOB_BANNER_UNIT_ID", "\"$bannerId\"")
        buildConfigField("String", "ADMOB_REWARDED_UNIT_ID", "\"$rewardedId\"")
        buildConfigField("String", "PREMIUM_CODE_HASH", "\"$premiumHash\"")
        buildConfigField("String", "PREMIUM_CODE_SALT", "\"$premiumSalt\"")
    }

    buildFeatures {
        buildConfig = true
        resValues = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.play.services.ads)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
