#!/bin/bash
cd /Users/abhishek/Projects/checkmat-native/mobile-app/android
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH
./gradlew assembleDebug
