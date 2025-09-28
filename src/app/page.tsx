'use client';

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-6 font-display">
          One Piece TCG
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Experience the ultimate digital trading card game based on the world of One Piece. 
          Build decks, battle opponents, and collect your favorite characters!
        </p>
        
        {isAuthenticated && user && (
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <p className="text-white text-lg">
              Welcome back, <span className="text-straw-hat-red font-bold">{user.username}</span>! 🏴‍☠️
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-straw-hat-red">Deck Building</CardTitle>
              <CardDescription className="text-gray-300">
                Create powerful decks with your favorite One Piece characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Build and customize decks with over 1000+ cards from the One Piece universe
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-straw-hat-blue">Online Battles</CardTitle>
              <CardDescription className="text-gray-300">
                Battle players from around the world in real-time matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Compete in ranked matches and climb the leaderboards
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-straw-hat-green">Collection</CardTitle>
              <CardDescription className="text-gray-300">
                Collect and trade cards with other players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Build your collection and discover rare cards
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Button asChild size="lg" className="btn-primary text-lg px-8 py-3">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild size="lg" className="btn-secondary text-lg px-8 py-3">
                <Link href="/battle">Start Battle</Link>
              </Button>
              <Button asChild size="lg" className="btn-secondary text-lg px-8 py-3">
                <Link href="/multiplayer">Multiplayer</Link>
              </Button>
              <Button 
                onClick={logout}
                size="lg" 
                className="btn-danger text-lg px-8 py-3"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="btn-primary text-lg px-8 py-3">
                <Link href="/auth/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 border-white/30 text-white hover:bg-white/10">
                <Link href="/about">Learn More</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
