$files = @(
    "$PSScriptRoot\capacitor.build.gradle",
    "$PSScriptRoot\..\capacitor-cordova-android-plugins\build.gradle",
    "$PSScriptRoot\..\capacitor-android\build.gradle"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        (Get-Content $file) -replace 'VERSION_21', 'VERSION_17' | Set-Content $file
    }
}