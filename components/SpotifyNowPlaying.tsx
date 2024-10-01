'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Music, Play, Pause } from 'lucide-react'

interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
}

interface SpotifyState {
  isPlaying: boolean
  track: SpotifyTrack | null
}

export function SpotifyNowPlaying() {
  const [spotifyState, setSpotifyState] = useState<SpotifyState>({
    isPlaying: false,
    track: null,
  })
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify-token', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to get access token')
      }
      const data = await response.json()
      setAccessToken(data.access_token)
    } catch (error) {
      console.error('Error fetching access token:', error)
      setError('Failed to connect to Spotify')
    }
  }, [])

  const fetchNowPlaying = useCallback(async () => {
    if (!accessToken) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.status === 204) {
        setSpotifyState({ isPlaying: false, track: null })
        return
      }

      if (response.status === 401) {
        await getAccessToken()
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSpotifyState({
        isPlaying: data.is_playing,
        track: data.item,
      })
    } catch (error) {
      console.error('Error fetching Spotify data:', error)
      setError('Failed to fetch current track')
    }
  }, [accessToken, getAccessToken])

  useEffect(() => {
    getAccessToken()
  }, [getAccessToken])

  useEffect(() => {
    if (accessToken) {
      fetchNowPlaying()
      const interval = setInterval(fetchNowPlaying, 30000)
      return () => clearInterval(interval)
    }
  }, [accessToken, fetchNowPlaying])

  if (error) {
    return (
      <div className="bg-red-500/20 text-white px-4 py-2 rounded mb-4 w-full">
        <Music className="w-5 h-5 mr-2 inline" />
        <span>{error}</span>
      </div>
    )
  }

  if (!spotifyState.track) {
    return (
      <div className="bg-gray-700/20 text-white px-4 py-2 rounded mb-4 w-full hover:bg-gray-700/30 transition-all duration-200 flex items-center justify-center">
        <Music className="w-5 h-5 mr-2" />
        <span>Şu an çalınmıyor</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-700/20 text-white px-4 py-2 rounded mb-4 w-full hover:bg-gray-700/30 transition-all duration-200 flex items-center space-x-4">
      <Image
        src={spotifyState.track.album.images[0].url}
        alt={spotifyState.track.name}
        width={60}
        height={60}
        className="rounded"
      />
      <div className="flex-1">
        <p className="font-semibold">{spotifyState.track.name}</p>
        <p className="text-sm text-gray-400">{spotifyState.track.artists.map(artist => artist.name).join(', ')}</p>
      </div>
      <div className="text-white">
        {spotifyState.isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6" />
        )}
      </div>
    </div>
  )
}