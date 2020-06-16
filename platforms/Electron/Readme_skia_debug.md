# Debugging Skia

Run electron with `--no-sandbox --enable-gpu-benchmarking`

Then open the console, and execute:

    chrome.gpuBenchmarking.printPagesToSkPictures('/tmp/output.skp')

Upload to [https://debugger.skia.org/](https://debugger.skia.org/)
