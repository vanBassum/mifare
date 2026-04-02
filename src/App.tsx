import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

export function App() {
  const [uid, setUid] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async () => {
    if (!("NDEFReader" in window)) {
      setError("Web NFC not supported. Use Chrome on Android.")
      return
    }
    setScanning(true)
    setError(null)
    setUid(null)
    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()
      reader.onreading = (event: any) => {
        const serial: string = event.serialNumber
        setUid(serial.toUpperCase())
        setScanning(false)
      }
      reader.onreadingerror = () => {
        setError("Could not read tag.")
        setScanning(false)
      }
    } catch (e: any) {
      setError(e.message)
      setScanning(false)
    }
  }, [])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">MIFARE Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a card to read its UID
          </p>
        </div>

        <Button
          size="lg"
          className="w-full text-lg"
          disabled={scanning}
          onClick={scan}
        >
          {scanning ? "Waiting for card..." : "Start Scan"}
        </Button>

        {uid && (
          <div className="w-full rounded-xl border bg-card p-5">
            <div className="text-xs text-muted-foreground">UID</div>
            <div className="mt-1 font-mono text-3xl font-bold text-green-500">
              {uid}
            </div>
          </div>
        )}

        {error && (
          <div className="w-full rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
