import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const TABLES_URL = 'https://functions.poehali.dev/96982b55-0efb-4c87-bf99-5eec303103c3';
const SONGS_URL = 'https://functions.poehali.dev/f15e4069-7dc9-4270-bd8e-60dd77f495ae';
const QUEUE_URL = 'https://functions.poehali.dev/1069be66-7cfa-40f0-8348-8d108c743c84';

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

interface QueueItem {
  id: number;
  song_id: number;
  table_id: number;
  status: string;
  added_at: string;
  song: Song;
  table_number: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTable, setNewTable] = useState({ table_number: '', login: '', password: '', hours: '2' });
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ table_number: '', login: '', password: '', hours: '2' });
  const [newSong, setNewSong] = useState({ title: '', artist: '', genre: '', file: null as File | null });
  const [selectedTableForKaraoke, setSelectedTableForKaraoke] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchTables();
    fetchSongs();
    fetchQueue();
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

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${QUEUE_URL}?status=pending`);
      const data = await response.json();
      setQueue(data.queue || []);
    } catch (error) {
      toast.error('Ошибка загрузки очереди');
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

  const handleEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTable) return;
    setLoading(true);

    try {
      const body: any = { id: editTable.id };
      if (editForm.table_number) body.table_number = parseInt(editForm.table_number);
      if (editForm.login) body.login = editForm.login;
      if (editForm.password) body.password = editForm.password;
      if (editForm.hours) body.hours = parseInt(editForm.hours);

      const response = await fetch(TABLES_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Стол обновлен успешно');
        setIsEditDialogOpen(false);
        setEditTable(null);
        fetchTables();
      } else {
        toast.error(data.error || 'Ошибка обновления стола');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    try {
      const response = await fetch(`${TABLES_URL}?id=${tableId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Стол удален');
        fetchTables();
      } else {
        toast.error(data.error || 'Ошибка удаления стола');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    }
  };

  const openEditDialog = (table: Table) => {
    setEditTable(table);
    setEditForm({
      table_number: table.table_number.toString(),
      login: table.login,
      password: '',
      hours: '2',
    });
    setIsEditDialogOpen(true);
  };

  const handlePlaySong = async (queueId: number, tableNumber: number) => {
    setSelectedTableForKaraoke(tableNumber);
    
    try {
      await fetch(QUEUE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: queueId, status: 'playing' }),
      });
      
      toast.success(`Караоке выведено на экран стола ${tableNumber}`);
      fetchQueue();
    } catch (error) {
      toast.error('Ошибка воспроизведения');
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

        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tables">Столы</TabsTrigger>
            <TabsTrigger value="queue">Очередь</TabsTrigger>
            <TabsTrigger value="songs">Библиотека</TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
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

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {tables.map((table) => (
                  <div key={table.id} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Стол {table.table_number}</span>
                        <Badge variant={table.is_active ? 'default' : 'secondary'}>
                          {table.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(table)}>
                          <Icon name="Edit" size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить стол?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Стол {table.table_number} будет деактивирован
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTable(table.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
          </TabsContent>

          <TabsContent value="queue">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="ListMusic" size={24} className="text-primary" />
                <h2 className="text-xl font-semibold">Очередь треков по столам</h2>
                <Badge variant="outline" className="ml-auto">{queue.length}</Badge>
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Icon name="ListMusic" size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Очередь пуста</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((item, index) => (
                    <div key={item.id} className="p-4 rounded-lg bg-muted/50 border hover:border-primary transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium text-lg">{item.song.title}</p>
                          <p className="text-sm text-muted-foreground">{item.song.artist}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">Стол {item.table_number}</Badge>
                            <Badge variant="outline">.{item.song.file_format}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={() => handlePlaySong(item.id, item.table_number)}
                      >
                        <Icon name="Tv" size={16} />
                        Вывести караоке на стол {item.table_number}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="songs">
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

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать стол {editTable?.table_number}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTable} className="space-y-4">
              <div>
                <Label>Номер стола</Label>
                <Input
                  type="number"
                  placeholder={editTable?.table_number.toString()}
                  value={editForm.table_number}
                  onChange={(e) => setEditForm({ ...editForm, table_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Логин</Label>
                <Input
                  type="text"
                  placeholder={editTable?.login}
                  value={editForm.login}
                  onChange={(e) => setEditForm({ ...editForm, login: e.target.value })}
                />
              </div>
              <div>
                <Label>Новый пароль (оставьте пустым, если не хотите менять)</Label>
                <Input
                  type="text"
                  placeholder="Новый пароль"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Продлить время работы (часов)</Label>
                <Select value={editForm.hours} onValueChange={(val) => setEditForm({ ...editForm, hours: val })}>
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
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
