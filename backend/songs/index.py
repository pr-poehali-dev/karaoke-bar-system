import json
import os
import psycopg2
import boto3
import base64

def handler(event: dict, context) -> dict:
    '''API для управления библиотекой треков караоке (.kar, .mid файлы)'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            search = params.get('search', '')
            genre = params.get('genre', '')
            
            query = f"SELECT id, title, artist, genre, file_url, file_format, duration, created_at FROM {os.environ['MAIN_DB_SCHEMA']}.songs WHERE 1=1"
            
            if search:
                query += f" AND (title ILIKE '%{search}%' OR artist ILIKE '%{search}%')"
            
            if genre:
                query += f" AND genre = '{genre}'"
            
            query += " ORDER BY artist, title"
            
            cursor.execute(query)
            songs = cursor.fetchall()
            
            result = []
            for song in songs:
                result.append({
                    'id': song[0],
                    'title': song[1],
                    'artist': song[2],
                    'genre': song[3],
                    'file_url': song[4],
                    'file_format': song[5],
                    'duration': song[6],
                    'created_at': song[7].isoformat() if song[7] else None
                })
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'songs': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            title = body.get('title')
            artist = body.get('artist')
            genre = body.get('genre', 'Без жанра')
            file_format = body.get('file_format')
            file_data = body.get('file_data')
            
            if not title or not artist or not file_data or not file_format:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title, artist, file_format and file_data required'}),
                    'isBase64Encoded': False
                }
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            
            file_bytes = base64.b64decode(file_data)
            file_key = f"karaoke/{artist}_{title}.{file_format}"
            
            s3.put_object(
                Bucket='files',
                Key=file_key,
                Body=file_bytes,
                ContentType=f'audio/{file_format}'
            )
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
            
            cursor.execute(
                f"""
                INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.songs 
                (title, artist, genre, file_url, file_format) 
                VALUES ('{title}', '{artist}', '{genre}', '{cdn_url}', '{file_format}')
                RETURNING id, title, artist, genre, file_url, file_format
                """
            )
            new_song = cursor.fetchone()
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'song': {
                        'id': new_song[0],
                        'title': new_song[1],
                        'artist': new_song[2],
                        'genre': new_song[3],
                        'file_url': new_song[4],
                        'file_format': new_song[5]
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
