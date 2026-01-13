import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const AUTH_URL = 'https://functions.poehali.dev/86cb3941-c0b7-48d2-831f-89e9afc31b5f';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [tableForm, setTableForm] = useState({ username: '', password: '' });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login',
          username: adminForm.username,
          password: adminForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', 'admin');
        toast.success('Добро пожаловать, администратор!');
        navigate('/admin');
      } else {
        toast.error(data.error || 'Неверные учетные данные');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleTableLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'table_login',
          username: tableForm.username,
          password: tableForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('table', JSON.stringify(data.table));
        localStorage.setItem('role', 'table');
        toast.success(`Добро пожаловать, стол ${data.table.table_number}!`);
        navigate('/table');
      } else {
        toast.error(data.error || 'Неверные учетные данные');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Icon name="Mic2" size={40} className="text-primary" />
          <h1 className="text-3xl font-bold">Караоке Система</h1>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="admin">Администратор</TabsTrigger>
            <TabsTrigger value="table">Стол</TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Логин</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Введите логин"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Пароль</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Вход...' : 'Войти как администратор'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="table">
            <form onSubmit={handleTableLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table-username">Логин стола</Label>
                <Input
                  id="table-username"
                  type="text"
                  placeholder="Введите логин"
                  value={tableForm.username}
                  onChange={(e) => setTableForm({ ...tableForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-password">Пароль</Label>
                <Input
                  id="table-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={tableForm.password}
                  onChange={(e) => setTableForm({ ...tableForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
