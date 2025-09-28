import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6 font-display">
            About One Piece TCG
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the ultimate digital trading card game based on the world of One Piece. 
            Build decks, battle opponents, and collect your favorite characters!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-straw-hat-red">Game Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li>• Build custom decks with 1000+ cards</li>
                <li>• Real-time multiplayer battles</li>
                <li>• Collection management system</li>
                <li>• Ranked competitive play</li>
                <li>• Social features and trading</li>
                <li>• Cross-platform compatibility</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-straw-hat-blue">Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li>• Built with Next.js and NestJS</li>
                <li>• PostgreSQL database</li>
                <li>• Real-time WebSocket communication</li>
                <li>• Cloudinary image storage</li>
                <li>• One Piece TCG API integration</li>
                <li>• Mobile and desktop support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="btn-primary text-lg px-8 py-3">
            <Link href="/">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
