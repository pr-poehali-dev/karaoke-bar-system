-- Создание таблицы пользователей (админ)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы столов
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    login VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Создание таблицы треков
CREATE TABLE IF NOT EXISTS songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    artist VARCHAR(500) NOT NULL,
    genre VARCHAR(100),
    file_url VARCHAR(1000),
    file_format VARCHAR(10),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы очереди
CREATE TABLE IF NOT EXISTS queue (
    id SERIAL PRIMARY KEY,
    song_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    played_at TIMESTAMP
);

-- Вставка админа по умолчанию (пароль будет хэшироваться в backend)
INSERT INTO users (username, password_hash, role) 
VALUES ('Ixen4300', 'temp_hash', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tables_expires_at ON tables(expires_at);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);