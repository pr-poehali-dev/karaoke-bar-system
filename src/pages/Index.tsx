import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
}

const MOCK_SONGS: Song[] = [
  { id: 1, title: 'Богема', artist: 'Би-2', genre: 'Рок' },
  { id: 2, title: 'Группа крови', artist: 'Кино', genre: 'Рок' },
  { id: 3, title: 'Комбат', artist: 'Любэ', genre: 'Шансон' },
  { id: 4, title: 'Vladimirsky Central', artist: 'Михаил Круг', genre: 'Шансон' },
  { id: 5, title: 'Мурка', artist: 'Народная', genre: 'Народная' },
  { id: 6, title: 'Катюша', artist: 'Народная', genre: 'Народная' },
  { id: 7, title: 'Осень', artist: 'ДДТ', genre: 'Рок' },
  { id: 8, title: 'Девушка из высшего общества', artist: 'Браво', genre: 'Поп' },
  { id: 9, title: 'Батарейка', artist: 'Жуки', genre: 'Поп' },
  { id: 10, title: 'Лирика', artist: 'Сплин', genre: 'Рок' },
];

interface QueueItem extends Song {
  tableNumber?: number;
  addedAt: Date;
}

const Index = () => {
  const [mode, setMode] = useState<'table' | 'admin'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [micVolume, setMicVolume] = useState([75]);
  const [reverbEffect, setReverbEffect] = useState([50]);
  const [echoEffect, setEchoEffect] = useState([30]);

  const filteredSongs = MOCK_SONGS.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToQueue = (song: Song) => {
    const newItem: QueueItem = {
      ...song,
      tableNumber: Math.floor(Math.random() * 20) + 1,
      addedAt: new Date(),
    };
    setQueue([...queue, newItem]);
    toast.success(`"${song.title}" добавлен в очередь`);
  };

  const playSong = (item: QueueItem) => {
    setCurrentSong(item);
    setQueue(queue.filter((q) => q.id !== item.id));
    toast.success(`Воспроизведение: ${item.title}`);
  };

  const removeSong = (id: number) => {
    setQueue(queue.filter((q) => q.id !== id));
    toast.info('Трек удалён из очереди');
  };

  const skipSong = () => {
    if (currentSong) {
      toast.info(`Пропущен: ${currentSong.title}`);
      setCurrentSong(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Icon name="Mic2" size={32} className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Караоке Система</h1>
          </div>
          <Button
            variant={mode === 'table' ? 'default' : 'secondary'}
            onClick={() => setMode(mode === 'table' ? 'admin' : 'table')}
            className="gap-2"
          >
            <Icon name={mode === 'table' ? 'Shield' : 'Users'} size={20} />
            {mode === 'table' ? 'Режим администратора' : 'Режим стола'}
          </Button>
        </div>

        {mode === 'table' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Icon
                      name="Search"
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Поиск по названию или исполнителю..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{song.title}</h3>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{song.genre}</Badge>
                        <Button
                          size="sm"
                          onClick={() => addToQueue(song)}
                          className="gap-2"
                        >
                          <Icon name="Plus" size={16} />
                          В очередь
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="ListMusic" size={24} className="text-primary" />
                  <h2 className="text-xl font-semibold">Моя очередь</h2>
                  <Badge variant="outline" className="ml-auto">
                    {queue.length}
                  </Badge>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="ListMusic" size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Очередь пуста</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queue.map((item, index) => (
                      <div
                        key={`${item.id}-${item.addedAt.getTime()}`}
                        className="p-3 rounded-lg bg-card border border-border"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.artist}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Icon name="Play" size={24} className="text-primary" />
                  <h2 className="text-xl font-semibold">Текущий трек</h2>
                </div>

                {currentSong ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon name="Music" size={32} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold">{currentSong.title}</h3>
                          <p className="text-lg text-muted-foreground">{currentSong.artist}</p>
                        </div>
                      </div>
                      {currentSong.tableNumber && (
                        <Badge variant="outline" className="text-sm">
                          Стол {currentSong.tableNumber}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Button variant="destructive" onClick={skipSong} className="gap-2">
                          <Icon name="SkipForward" size={20} />
                          Пропустить трек
                        </Button>
                        <Button variant="secondary" className="gap-2">
                          <Icon name="Tv" size={20} />
                          Вывести на экран
                        </Button>
                      </div>

                      <Tabs defaultValue="mic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="mic">Микрофон</TabsTrigger>
                          <TabsTrigger value="effects">Эффекты</TabsTrigger>
                        </TabsList>
                        <TabsContent value="mic" className="space-y-4 pt-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Громкость микрофона</label>
                              <span className="text-sm text-muted-foreground">{micVolume}%</span>
                            </div>
                            <Slider
                              value={micVolume}
                              onValueChange={setMicVolume}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="effects" className="space-y-4 pt-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Реверберация</label>
                              <span className="text-sm text-muted-foreground">{reverbEffect}%</span>
                            </div>
                            <Slider
                              value={reverbEffect}
                              onValueChange={setReverbEffect}
                              max={100}
                              step={1}
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Эхо</label>
                              <span className="text-sm text-muted-foreground">{echoEffect}%</span>
                            </div>
                            <Slider
                              value={echoEffect}
                              onValueChange={setEchoEffect}
                              max={100}
                              step={1}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Icon name="Music" size={64} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Нет активного трека</p>
                    <p className="text-sm">Выберите трек из очереди</p>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Clock" size={24} className="text-primary" />
                  <h2 className="text-xl font-semibold">Очередь запросов</h2>
                  <Badge variant="outline" className="ml-auto">
                    {queue.length}
                  </Badge>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="ListMusic" size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Очередь пуста</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {queue.map((item, index) => (
                      <div
                        key={`${item.id}-${item.addedAt.getTime()}`}
                        className="p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
                            {item.tableNumber && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Стол {item.tableNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => playSong(item)}
                            className="flex-1 gap-2"
                          >
                            <Icon name="Play" size={14} />
                            Играть
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeSong(item.id)}
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
