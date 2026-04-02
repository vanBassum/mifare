import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface CardInfo {
  uid: string
  total: number
  expiry: string
  remaining: number
}

function parseCSV(text: string): CardInfo[] {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [uid, total, expiry, remaining] = line.split(";")
      return {
        uid: uid.trim().toUpperCase(),
        total: parseInt(total),
        expiry: expiry.trim(),
        remaining: parseInt(remaining),
      }
    })
}

export function App() {
  const [cards, setCards] = useState<CardInfo[]>([])
  const [result, setResult] = useState<CardInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "beurten.csv")
      .then((r) => r.text())
      .then((t) => setCards(parseCSV(t)))
      .catch(() => setError("Failed to load beurten.csv"))
  }, [])

  const lookup = useCallback(
    (uid: string) => {
      const normalized = uid.replace(/:/g, "").toUpperCase()
      const card = cards.find((c) => c.uid === normalized)
      if (card) {
        setResult(card)
        setNotFound(false)
      } else {
        setResult(null)
        setNotFound(true)
      }
    },
    [cards],
  )

  const scan = useCallback(async () => {
    if (!("NDEFReader" in window)) {
      setError("Web NFC not supported. Use Chrome on Android.")
      return
    }
    setScanning(true)
    setError(null)
    setResult(null)
    setNotFound(false)
    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()
      reader.onreading = (event: any) => {
        const serial: string = event.serialNumber
        const uid = serial.replace(/:/g, "").toUpperCase()
        lookup(uid)
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
  }, [lookup])

  const expired = result
    ? new Date(result.expiry) < new Date()
    : false

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">MIFARE Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a card to check your points
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

        {result && (
          <div className="w-full rounded-xl border bg-card p-5">
            <div className="text-xs text-muted-foreground">UID</div>
            <div className="mt-1 font-mono text-sm">{result.uid}</div>

            <div className="mt-4 text-xs text-muted-foreground">
              Remaining Points
            </div>
            <div className="mt-1 font-mono text-5xl font-bold text-green-500">
              {result.remaining}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              of {result.total} purchased
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Valid until
            </div>
            <div
              className={`mt-1 text-sm font-medium ${expired ? "text-destructive" : ""}`}
            >
              {new Date(result.expiry).toLocaleDateString()}
              {expired && " (expired)"}
            </div>
          </div>
        )}

        {notFound && (
          <div className="w-full rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Card not found in database.
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
