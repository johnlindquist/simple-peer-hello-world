import type { NextPage } from "next"
import { useCallback, useEffect, useRef, useState } from "react"
import Peer from "simple-peer"

const Home: NextPage = () => {
  const peerRef = useRef<Peer.Instance>()
  const [offer, setOffer] = useState("")
  const [answer, setAnswer] = useState("")
  const [initiator, setInitiator] = useState(false)

  useEffect(() => {
    if (location.search.includes("init")) {
      setInitiator(true)
      console.log(`I'm the initiator`)
    } else {
      console.log(`I'm not the initiator`)
    }
  }, [])

  useEffect(() => {
    peerRef.current = new Peer({
      initiator,
      trickle: false,
    })

    return () => {
      peerRef.current?.destroy()
    }
  }, [initiator])

  useEffect(() => {
    if (!peerRef.current) return

    const peer = peerRef.current

    console.log(`Peer created. Initiator: ${initiator}`)
    peer.on("signal", data => {
      console.log(`Type: ${data.type}`, data)
      if (data.type === "offer") {
        setOffer(JSON.stringify(data))
      } else if (data.type === "answer") {
        setAnswer(JSON.stringify(data))
      }
    })

    peer.on("connect", () => {
      console.log("connected")
      peer.send(`Hello from the ${initiator ? "initiator" : "receiver"}`)
    })

    peer.on("error", err => {
      console.log("error", err)
    })

    peer.on("data", data => {
      console.log("data", data.toString())
    })

    return () => {
      peer.destroy()
    }
  }, [initiator])

  const peerSend = useCallback((data: any) => {
    if (!peerRef.current) return
    peerRef.current.send(data)
  }, [])

  const peerSignal = useCallback((data: any) => {
    if (!peerRef.current) return
    console.log(`Signaling offer:`, data)

    peerRef.current.signal(typeof data === "string" ? JSON.parse(data) : data)
  }, [])

  return (
    <div className="flex h-screen flex-row items-center justify-evenly py-2">
      {/* Create a textarea to display the offer */}

      <div className="flex flex-col h-1/2">
        <textarea
          className="border border-gray-300 rounded p-2 min-w-screen font-mono text-xs h-full"
          value={offer}
          onChange={e => setOffer(e.target.value)}
        />

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
          onClick={() => {
            if (initiator) {
              navigator.clipboard.writeText(offer)
            } else {
              peerSignal(offer)
            }
          }}
        >
          {initiator ? "Copy offer to clipboard" : "Signal Offer Received"}
        </button>
      </div>

      <div className="flex flex-col h-1/2">
        {/* Create a textarea to display the answer */}
        <textarea
          className="border border-gray-300 rounded p-2 min-w-screen font-mono text-xs h-full"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />

        {/* Create a button to signal the offer */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
          onClick={() => {
            if (initiator) {
              peerSignal(answer)
            } else {
              navigator.clipboard.writeText(answer)
            }
          }}
        >
          {initiator ? "Signal Answer Received" : "Copy answer to clipboard"}
        </button>
      </div>
    </div>
  )
}

export default Home
