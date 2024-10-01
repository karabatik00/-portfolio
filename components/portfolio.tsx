'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Github, Instagram, Twitter, Linkedin, Coffee, Heart, ExternalLink, ChevronLeft, Mail, Phone, MapPin, Menu, X, Play, Pause, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Timestamp } from 'firebase/firestore';
import '../styles/custom-scrollbar.css'


interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
}
interface Comment {
  id: string;
  name: string;
  message: string;
  createdAt: Timestamp;
}
const colorClasses = [
  'bg-red-500/20',
  'bg-blue-500/20',
  'bg-green-500/20',
  'bg-yellow-500/20',
  'bg-purple-500/20',
  'bg-pink-500/20',
  'bg-indigo-500/20',
  'bg-teal-500/20',
]
interface SpotifyState {
  isPlaying: boolean
  track: SpotifyTrack | null
}

interface BlogGonderi {
  id: number;
  baslik: string;
  ozet: string;
  tarih: string;
  okumaSuresi: string;
  icerik: string;
}
interface GitHubRepo {
  id: number
  name: string
  description: string
  html_url: string
  stargazers_count: number
  language: string
  homepage: string
}
export function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ name: '', message: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.name && newComment.message) {
      await addDoc(collection(db, 'comments'), {
        ...newComment,
        createdAt: Timestamp.now()
      });
      setNewComment({ name: '', message: '' });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="relative bg-gray-900/50 rounded-lg p-4 h-[500px] flex flex-col">
      <h3 className="text-2xl font-bold mb-4 text-white">Yorumlar</h3>
      <div className="flex-grow overflow-y-auto pr-4 space-y-4 custom-scrollbar">
        {comments.map((comment, index) => (
          <div
            key={comment.id}
            className={`${colorClasses[index % colorClasses.length]} p-4 rounded-lg shadow-md`}
          >
            <p className="font-semibold text-white">{comment.name}</p>
            <p className="text-gray-300 mt-2">{comment.message}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-white text-black hover:bg-gray-200 transition-colors duration-200 font-bold py-2 px-4 rounded">
              Yorum Yap
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Yorum Yap</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="İsminiz"
                value={newComment.name}
                onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                required
                className="bg-gray-700 text-white border-gray-600 focus:border-white"
              />
              <Textarea
                placeholder="Yorumunuz"
                value={newComment.message}
                onChange={(e) => setNewComment({ ...newComment, message: e.target.value })}
                required
                className="bg-gray-700 text-white border-gray-600 focus:border-white"
              />
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 transition-colors duration-200 font-bold py-2 px-4 rounded">
                Gönder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
function SpotifyNowPlaying() {
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

export function Portfolio() {
  const [aktifBolum, setAktifBolum] = useState('anasayfa')
  const [aktifBlogGonderi, setAktifBlogGonderi] = useState<BlogGonderi | null>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)

  const bolumGoster = useCallback(() => {
    switch (aktifBolum) {
      case 'blog':
        return aktifBlogGonderi ? (
          <BlogGonderibolumu gonderi={aktifBlogGonderi} setAktifBlogGonderi={setAktifBlogGonderi} />
        ) : (
          <Blogbolumu setAktifBlogGonderi={setAktifBlogGonderi} />
        )
      case 'projeler':
        return <Projelerbolumu />
      case 'iletisim':
        return <Iletisimbolumu />
      default:
        return <Anasayfabolumu />
    }
  }, [aktifBolum, aktifBlogGonderi])

  const navigasyonuIsle = useCallback((bolum: string) => {
    setAktifBolum(bolum)
    setAktifBlogGonderi(null)
    setMobilMenuAcik(false)
  }, [])

  useEffect(() => {
    const boyutDegisiminiIsle = () => {
      if (window.innerWidth > 768 && mobilMenuAcik) {
        setMobilMenuAcik(false)
      }
    }

    window.addEventListener('resize', boyutDegisiminiIsle)
    return () => window.removeEventListener('resize', boyutDegisiminiIsle)
  }, [mobilMenuAcik])

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col justify-between relative">
      <style jsx global>{`
        body {
          background-color: #111;
          background-image: 
            linear-gradient(45deg, #222 25%, transparent 25%),
            linear-gradient(-45deg, #222 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #222 75%),
            linear-gradient(-45deg, transparent 75%, #222 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
      <div className="w-full max-w-4xl mx-auto space-y-4 relative z-20">
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-4 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-800/40 hover:to-gray-900/40"
        >
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigasyonuIsle('anasayfa')}
              className="flex items-center space-x-2 hover:text-yellow-500 transition-colors duration-200"
            >
              <span className="text-yellow-500 text-2xl">🦁</span>
              <span className="font-semibold">ridvan.dev</span>
            </button>
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                {[
                  { id: 'anasayfa', text: 'Anasayfa' },
                  { id: 'blog', text: 'Blog' },
                  { id: 'projeler', text: 'Projeler' },
                  { id: 'iletisim', text: 'İletişim' }
                ].map((bolum) => (
                  <li key={bolum.id}>
                    <button
                      onClick={() => navigasyonuIsle(bolum.id)}
                      className={`hover:text-yellow-500 transition-colors duration-200 ${
                        aktifBolum === bolum.id ? 'text-yellow-500' : ''
                      }`}
                    >
                      {bolum.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              className="md:hidden text-white hover:text-yellow-500 transition-colors duration-200"
              onClick={() => setMobilMenuAcik(!mobilMenuAcik)}
              aria-label={mobilMenuAcik ? "Menüyü kapat" : "Menüyü aç"}
            >
              {mobilMenuAcik ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </motion.header>

        <AnimatePresence>
          {mobilMenuAcik && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-lg border border-white/10"
            >
              <nav className="p-4">
                <ul className="space-y-2">
                  {[
                    { id: 'anasayfa', text: 'Anasayfa' },
                    { id: 'blog', text: 'Blog' },
                    { id: 'projeler', text: 'Projeler' },
                    { id: 'iletisim', text: 'İletişim' }
                  ].map((bolum) => (
                    <li key={bolum.id}>
                      <button
                        onClick={() => navigasyonuIsle(bolum.id)}
                        className={`w-full text-left py-2 px-4 rounded hover:bg-gray-700/20 transition-colors duration-200 ${
                          aktifBolum === bolum.id ? 'text-yellow-500' : ''
                        }`}
                      >
                        {bolum.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.main
            key={aktifBolum + (aktifBlogGonderi ? aktifBlogGonderi.id : '')}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            {bolumGoster()}
          </motion.main>
        </AnimatePresence>

        <motion.footer
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto mt-8 bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-4 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-800/40 hover:to-gray-900/40"
        >

        <div className="  border-gray-700 flex flex-col items-center">
          <div className="text-sm text-gray-400 mb-2">
            © {new Date().getFullYear()} Rıdvan Bahçeci. Tüm hakları saklıdır.
          </div>
          <div className="text-sm text-gray-400 flex items-center">
  Next.js <Heart className="w-4 h-4 mx-1 text-red-500" /> Tailwind CSS kullanılarak ile yapılmıştır
          </div>
        </div>
        </motion.footer>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  )
}

function Anasayfabolumu() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-gray-800/30 to-indigo-900/30 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-800/40 hover:to-indigo-900/40"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Image src="/pp.jpg" alt="Rıdvan Bahçeci"  width={80} height={80} className="rounded-full" priority />
            <div>
              <h1 className="text-2xl font-bold">Rıdvan Bahçeci</h1>
              <p className="text-gray-400">Full-Stack Developer</p>
            </div>
          </div>
          <SpotifyNowPlaying />
          <div className="flex space-x-4">
            <a href="https://github.com/karabatik00" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="w-6 h-6 hover:text-yellow-500 transition-colors duration-200" />
            </a>
            <a href="https://www.instagram.com/bahceci_77/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="w-6 h-6 hover:text-yellow-500 transition-colors duration-200" />
            </a>
            <a href="https://x.com/ridvanbahceci0" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="w-6 h-6 hover:text-yellow-500 transition-colors duration-200" />
            </a>
            <a href="https://www.linkedin.com/in/r%C4%B1dvan-bah%C3%A7eci-138756299/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6 hover:text-yellow-500 transition-colors duration-200" />
            </a>
            <a href="https://buymeacoffee.com/karabatik" target="_blank" rel="noopener noreferrer" aria-label="Buy Me a Coffee">
              <Coffee className="w-6 h-6 hover:text-yellow-500 transition-colors duration-200" />
            </a>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900/30 to-purple-900/30 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-900/40 hover:to-purple-900/40"
        >
          <h2 className="text-2xl font-bold mb-4">Öğrenmeye Tutkulu Bir Full-Stack Developer</h2>
          <p className="text-gray-400">
          Merhaba, ben Rıdvan. Yenilikçi teknolojilere olan tutkum sayesinde projelerinize değerli katkılarda bulunacağıma inanıyorum. Web geliştirme alanındaki yetkinliğimle, ekip çalışmasına uyum sağlayarak projelerinizi başarıyla hayata geçirebilirim.          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gradient-to-br from-gray-800/30 to-indigo-900/30 p-6 rounded-lg border border-white/10"
  >
    <h3 className="text-xl font-bold mb-4">Teknolojiler</h3>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
      {[
        { icon: "nodejs", name: "Node.js" },
        { icon: "react", name: "React" },
        { icon: "redux", name: "Redux" },
        { icon: "javascript", name: "JavaScript" },
        { icon: "typescript", name: "TypeScript" },
        { icon: "go", name: "Go" },
        { icon: "express", name: "Express.js" },
        { icon: "vue", name: "Vue.js" },
        { icon: "bootstrap", name: "Bootstrap" },
        { icon: "html5", name: "HTML5" },
        { icon: "firebase", name: "Firebase" },
        { icon: "mongodb", name: "MongoDB" },
        { icon: "postgres", name: "PostgreSQL" },
        { icon: "python", name: "Python" },
      ].map((tech, index) => (
        <motion.div
          key={tech.name}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex flex-col items-center justify-center p-2 bg-gray-700/20 rounded-lg hover:bg-gray-700/30 transition-all duration-200"
        >
          <Image 
            src={`/${tech.icon}.png`} // Doğru yol
            alt={tech.name}  
            width={70}  // Boyutu büyüttüm
            height={70} // Boyutu büyüttüm
            className="rounded-lg" 
            priority 
          />
          <span className="text-xs text-center mt-2">{tech.name}</span> {/* Boşluk eklendi */}
        </motion.div>
      ))}
    </div>
  </motion.div>
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.2 }}
    className="bg-gradient-to-br from-gray-900/30 to-blue-900/30 p-4 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-900/40 hover:to-blue-900/40"
  >
    <CommentSection />
  </motion.div>
</div>

    </>
  )
}

function Blogbolumu({ setAktifBlogGonderi }: { setAktifBlogGonderi: (gonderi: BlogGonderi) => void }) {
  const blogGonderileri: BlogGonderi[] = [
    {
      id: 1,
      baslik: "Next.js ile Başlangıç",
      ozet: "Next.js, güçlü bir React çerçevesi ile modern web uygulamaları nasıl oluşturulur öğrenin.",
      tarih: "1.10.2024",
      okumaSuresi: "1 dk okuma",
      icerik: "Next.js, sunucu tarafında işlenen ve statik olarak oluşturulan web uygulamalarını kolayca oluşturmanıza olanak tanıyan popüler bir React çerçevesidir. Bu yazıda, Next.js'in temellerini ve ilk projenize nasıl başlayacağınızı keşfedeceğiz. Sayfalar oluşturma, yönlendirme ve uygulamanızı dağıtma gibi konuları ele alacağız. Bu eğitimin sonunda, hızlı, SEO dostu web uygulamaları oluşturmak için Next.js'i nasıl kullanacağınız konusunda sağlam bir anlayışa sahip olacaksınız. İster deneyimli bir React geliştiricisi olun, ister yeni başlıyor olun, Next.js size daha iyi web uygulamaları oluşturmanıza yardımcı olacak bir dizi özellik sunar.",
    },
    {
      id: 2,
      baslik: "TypeScript'i Ustalaşmak",
      ozet: "TypeScript'e derinlemesine dalın ve daha sağlam ve bakımı kolay kod yazmayı öğrenin.",
      tarih: "1.10.2024",
      okumaSuresi: "1 dk okuma",
      icerik: "TypeScript, düz JavaScript'e derlenen tipli bir JavaScript üst kümesidir. Geleneksel JavaScript'e göre daha iyi araçlar, gelişmiş kod kalitesi ve artırılmış geliştirici üretkenliği gibi birçok avantaj sunar. Bu kapsamlı rehberde, statik tipleme, arayüzler ve jenerikler gibi TypeScript'in temel özelliklerini keşfedeceğiz. Ayrıca, TypeScript'i mevcut JavaScript projelerinize entegre etme ve geliştirme sürecinin erken aşamalarında hataları yakalamak için güçlü tip sisteminden yararlanma konusundaki en iyi uygulamaları tartışacağız. TypeScript'i ustalaşarak, daha ölçeklenebilir ve bakımı kolay kod yazabileceksiniz, bu da modern web geliştirme için temel bir beceri haline geliyor.",
    },
    {
      id: 3,
      baslik: "Backend Geliştirme için Go",
      ozet: "Verimli ve ölçeklenebilir backend hizmetleri oluşturmak için Go kullanmanın faydalarını keşfedin.",
      tarih: "1.10.2024",
      okumaSuresi: "1 dk okuma",
      icerik: "Go, diğer adıyla Golang, Google tarafından tasarlanmış statik olarak yazılmış, derlenmiş bir dildir. Basitliği, performansı ve yerleşik eşzamanlılık özellikleri nedeniyle backend geliştirmede popülerlik kazanıyor. Bu makalede, Go'nun backend hizmetleri oluşturmak için neden mükemmel bir seçim olduğunu inceleyeceğiz. HTTP sunma, JSON işleme ve veritabanı işlemleri gibi yaygın backend görevleri için sağlam destek sağlayan standart kütüphanesini keşfedeceğiz. Ayrıca, birden çok görevin aynı anda verimli bir şekilde işlenmesine olanak tanıyan Go'nun eşzamanlılık modelini tartışacağız. Bu yazının sonunda, neden birçok şirketin backend altyapıları için Go'yu seçtiğini ve kendi projelerinizde Go ile nasıl başlayabileceğinizi anlayacaksınız.",
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Blog Gönderileri</h2>
      {blogGonderileri.map((gonderi, index) => (
        <motion.div
          key={gonderi.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-gradient-to-br from-gray-800/30 to-indigo-900/30 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-800/40 hover:to-indigo-900/40"
        >
          <h3 className="text-xl font-semibold mb-2">{gonderi.baslik}</h3>
          <p className="text-gray-400 mb-4">{gonderi.ozet}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{gonderi.tarih}</span>
            <span>{gonderi.okumaSuresi}</span>
          </div>
          <button
            onClick={() => setAktifBlogGonderi(gonderi)}
            className="mt-4 bg-white text-black px-4 py-2 rounded flex items-center justify-center hover:bg-opacity-90 transition-all duration-200"
          >
            Devamını Oku
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}

function BlogGonderibolumu({ gonderi, setAktifBlogGonderi }: { gonderi: BlogGonderi, setAktifBlogGonderi: (gonderi: BlogGonderi | null) => void }) {
  if (!gonderi) return null

  return (
    <div className="space-y-6">
      <button
        onClick={() => setAktifBlogGonderi(null)}
        className="flex items-center text-yellow-500 hover:text-yellow-400 transition-colors duration-200"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Blog&apos;a Geri Dön
      </button>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-gray-800/30 to-indigo-900/30 p-6 rounded-lg border border-white/10"
      >
        <h2 className="text-3xl font-bold mb-4">{gonderi.baslik}</h2>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
          <span>{gonderi.tarih}</span>
          <span>{gonderi.okumaSuresi}</span>
        </div>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{gonderi.icerik}</p>
      </motion.div>
    </div>
  )
}

function Projelerbolumu() {
  const [projeler, setProjeler] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjeler = async () => {
      try {
        const response = await fetch('https://api.github.com/users/karabatik00/repos')
        if (!response.ok) {
          throw new Error('GitHub API isteği başarısız oldu')
        }
        const data = await response.json()
        setProjeler(data)
        setLoading(false)
      } catch (error) {
        console.error('Projeler yüklenirken hata:', error)
        setError('Projeler yüklenirken bir hata oluştu')
        setLoading(false)
      }
    }

    fetchProjeler()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Projeler</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projeler.map((proje, index) => (
          <motion.div
            key={proje.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-900/30 to-purple-900/30 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:from-gray-900/40 hover:to-purple-900/40"
          >
            <h3 className="text-xl font-semibold mb-2">{proje.name}</h3>
            <p className="text-gray-400 mb-4">{proje.description || 'Açıklama yok'}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {proje.language && (
                <span className="bg-gray-700/20 text-white px-2 py-1 rounded text-sm">
                  {proje.language}
                </span>
              )}
              <span className="bg-gray-700/20 text-white px-2 py-1 rounded text-sm flex items-center">
                <Github className="w-4 h-4 mr-1" />
                {proje.stargazers_count}
              </span>
            </div>
            <div className="flex space-x-2">
              <a
                href={proje.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black px-4 py-2 rounded flex items-center justify-center flex-1 hover:bg-opacity-90 transition-all duration-200"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </a>
              {proje.homepage && (
                <a
                  href={proje.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-500 text-black px-4 py-2 rounded flex items-center justify-center flex-1 hover:bg-opacity-90 transition-all duration-200"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Demo
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}



function Iletisimbolumu() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        throw new Error('Sunucu hatası')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Mesajınız başarıyla gönderildi!', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        setFormData({ name: '', email: '', message: '' }) // Form alanlarını temizle
      } else {
        throw new Error(data.message || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error)
      toast.error('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold mb-6">İletişime Geçin</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800/30 to-indigo-900/30 p-6 rounded-lg border border-white/10">
          <h3 className="text-xl font-semibold mb-4">İletişime Geçin</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">İsim</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Adınız" className="text-black" required />
            </div>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="E-posta adresiniz" className="text-black" required />
            </div>
            <div>
              <Label htmlFor="message">Mesaj</Label>
              <Textarea id="message" name="message" value={formData.message} onChange={handleChange} className="text-black" placeholder="Mesajınız" required />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
            </Button>
          </form>
        </div>
        <div className="bg-gradient-to-br from-gray-900/30 to-purple-900/30 p-6 rounded-lg border border-white/10">
          <h3 className="text-xl font-semibold mb-4">İletişim Bilgileri</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              <span>bahceciridvan27@gmail.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              <span>+90 537 824 5034</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>İstanbul, Türkiye</span>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Beni Takip Edin</h4>
            <div className="flex space-x-4">
            <a href="https://github.com/karabatik00" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition-colors duration-200">
  <Github className="w-6 h-6" />
</a>
<a href="https://x.com/ridvanbahceci0" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition-colors duration-200">
  <Twitter className="w-6 h-6" />
</a>
<a href="https://www.linkedin.com/in/r%C4%B1dvan-bah%C3%A7eci-138756299/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition-colors duration-200">
  <Linkedin className="w-6 h-6" />
</a>

            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}