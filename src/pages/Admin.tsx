import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const TABLES_URL = 'https://functions.poehali.dev/96982b55-0efb-4c87-bf99-5eec303103c3';
const SONGS_URL = 'https://functions.poehali.dev/f15e4069-7dc9-4270-bd8e-60dd77f495ae';

interface Table {
  id: number;
  table_number: number;
  login: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  file_url: string;
  file_format: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTable, setNewTable] = useState({ table_number: '', login: '', password: '', hours: '2' });
  const [newSong, setNewSong] = useState({ title: '', artist: '', genre: '', file: null as File | null });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchTables();
    fetchSongs();
  }, [navigate]);

  const fetchTables = async () => {
    try {
      const response = await fetch(TABLES_URL);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      toast.error('Ошибка загрузки столов');
    }
  };

  const fetchSongs = async () => {
    try {
      const response = await fetch(SONGS_URL);
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (error) {
      toast.error('Ошибка загрузки треков');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(TABLES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: parseInt(newTable.table_number),
          login: newTable.login,
          password: newTable.password,
          hours: parseInt(newTable.hours),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Стол создан успешно');
        setNewTable({ table_number: '', login: '', password: '', hours: '2' });
        fetchTables();
      } else {
        toast.error(data.error || 'Ошибка создания стола');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.file) {
      toast.error('Выберите файл');
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const fileFormat = newSong.file!.name.split('.').pop() || 'kar';

        const response = await fetch(SONGS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newSong.title,
            artist: newSong.artist,
            genre: newSong.genre || 'Без жанра',
            file_data: base64,
            file_format: fileFormat,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Трек добавлен в библиотеку');
          setNewSong({ title: '', artist: '', genre: '', file: null });
          fetchSongs();
        } else {
          toast.error(data.error || 'Ошибка загрузки трека');
        }
        setLoading(false);
      };

      reader.readAsDataURL(newSong.file);
    } catch (error) {
      toast.error('Ошибка загрузки файла');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={32} className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Панель администратора</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <Icon name="LogOut" size={20} />
            Выход
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Users" size={24} className="text-primary" />
              <h2 className="text-xl font-semibold">Управление столами</h2>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Создать доступ для стола
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый стол</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTable} className="space-y-4">
                  <div>
                    <Label>Номер стола</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={newTable.table_number}
                      onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Логин</Label>
                    <Input
                      type="text"
                      placeholder="table1"
                      value={newTable.login}
                      onChange={(e) => setNewTable({ ...newTable, login: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Пароль</Label>
                    <Input
                      type="text"
                      placeholder="pass123"
                      value={newTable.password}
                      onChange={(e) => setNewTable({ ...newTable, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Время работы (часов)</Label>
                    <Select value={newTable.hours} onValueChange={(val) => setNewTable({ ...newTable, hours: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 час</SelectItem>
                        <SelectItem value="2">2 часа</SelectItem>
                        <SelectItem value="3">3 часа</SelectItem>
                        <SelectItem value="4">4 часа</SelectItem>
                        <SelectItem value="6">6 часов</SelectItem>
                        <SelectItem value="12">12 часов</SelectItem>
                        <SelectItem value="24">24 часа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Создание...' : 'Создать'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tables.map((table) => (
                <div key={table.id} className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">Стол {table.table_number}</span>
                      <Badge variant={table.is_active ? 'default' : 'secondary'}>
                        {table.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Логин: {table.login}</p>
                  <p className="text-sm text-muted-foreground">
                    Истекает: {new Date(table.expires_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Music" size={24} className="text-primary" />
              <h2 className="text-xl font-semibold">Библиотека треков</h2>
              <Badge variant="outline" className="ml-auto">{songs.length}</Badge>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  <Icon name="Upload" size={20} className="mr-2" />
                  Загрузить трек (.kar / .mid)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить трек</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadSong} className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input
                      type="text"
                      placeholder="Богема"
                      value={newSong.title}
                      onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Исполнитель</Label>
                    <Input
                      type="text"
                      placeholder="Би-2"
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Жанр</Label>
                    <Input
                      type="text"
                      placeholder="Рок"
                      value={newSong.genre}
                      onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Файл (.kar или .mid)</Label>
                    <Input
                      type="file"
                      accept=".kar,.mid"
                      onChange={(e) => setNewSong({ ...newSong, file: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Добавить трек'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {songs.map((song) => (
                <div key={song.id} className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{song.genre}</Badge>
                    <Badge variant="outline" className="text-xs">.{song.file_format}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
