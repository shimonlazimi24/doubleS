// Encodes a mono 24 kHz 16-bit PCM WAV into an AAC .m4a with AVFoundation and
// prints the duration in seconds. No ffmpeg on this machine.
// Usage: swift encode-aac.swift <in.wav> <out.m4a> [bitrate, default 48000]
import AVFoundation

let a = CommandLine.arguments
guard a.count >= 3 else { fputs("usage: encode-aac.swift in.wav out.m4a [bitrate]\n", stderr); exit(2) }
let inURL = URL(fileURLWithPath: a[1]), outURL = URL(fileURLWithPath: a[2])
let bitrate = a.count > 3 ? Int(a[3])! : 48000
try? FileManager.default.removeItem(at: outURL)

let input = try AVAudioFile(forReading: inURL)
let fmt = input.processingFormat
let settings: [String: Any] = [
  AVFormatIDKey: kAudioFormatMPEG4AAC,
  AVSampleRateKey: fmt.sampleRate,
  AVNumberOfChannelsKey: 1,
  AVEncoderBitRateKey: bitrate,
  AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
]
let output = try AVAudioFile(forWriting: outURL, settings: settings, commonFormat: fmt.commonFormat, interleaved: fmt.isInterleaved)
let chunk: AVAudioFrameCount = 32768
let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: chunk)!
while input.framePosition < input.length {
  try input.read(into: buf, frameCount: chunk)
  if buf.frameLength == 0 { break }
  try output.write(from: buf)
}
let seconds = Double(input.length) / fmt.sampleRate
print(String(format: "%.2f", seconds))
