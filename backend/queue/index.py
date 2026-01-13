import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления очередью треков по столам'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            table_id = params.get('table_id')
            status = params.get('status', 'pending')
            
            if table_id:
                query = f"""
                    SELECT q.id, q.song_id, q.table_id, q.status, q.added_at, q.played_at,
                           s.title, s.artist, s.genre, s.file_url, s.file_format,
                           t.table_number
                    FROM {os.environ['MAIN_DB_SCHEMA']}.queue q
                    JOIN {os.environ['MAIN_DB_SCHEMA']}.songs s ON q.song_id = s.id
                    JOIN {os.environ['MAIN_DB_SCHEMA']}.tables t ON q.table_id = t.id
                    WHERE q.table_id = {table_id}
                """
            else:
                query = f"""
                    SELECT q.id, q.song_id, q.table_id, q.status, q.added_at, q.played_at,
                           s.title, s.artist, s.genre, s.file_url, s.file_format,
                           t.table_number
                    FROM {os.environ['MAIN_DB_SCHEMA']}.queue q
                    JOIN {os.environ['MAIN_DB_SCHEMA']}.songs s ON q.song_id = s.id
                    JOIN {os.environ['MAIN_DB_SCHEMA']}.tables t ON q.table_id = t.id
                """
            
            if status:
                query += f" WHERE q.status = '{status}'"
            
            query += " ORDER BY q.added_at ASC"
            
            cursor.execute(query)
            items = cursor.fetchall()
            
            result = []
            for item in items:
                result.append({
                    'id': item[0],
                    'song_id': item[1],
                    'table_id': item[2],
                    'status': item[3],
                    'added_at': item[4].isoformat() if item[4] else None,
                    'played_at': item[5].isoformat() if item[5] else None,
                    'song': {
                        'title': item[6],
                        'artist': item[7],
                        'genre': item[8],
                        'file_url': item[9],
                        'file_format': item[10]
                    },
                    'table_number': item[11]
                })
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'queue': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            song_id = body.get('song_id')
            table_id = body.get('table_id')
            
            if not song_id or not table_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'song_id and table_id required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                f"""
                INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.queue (song_id, table_id, status)
                VALUES ({song_id}, {table_id}, 'pending')
                RETURNING id, song_id, table_id, status, added_at
                """
            )
            new_item = cursor.fetchone()
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'item': {
                        'id': new_item[0],
                        'song_id': new_item[1],
                        'table_id': new_item[2],
                        'status': new_item[3],
                        'added_at': new_item[4].isoformat()
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            queue_id = body.get('id')
            status = body.get('status')
            
            if not queue_id or not status:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'id and status required'}),
                    'isBase64Encoded': False
                }
            
            played_at = f", played_at = '{datetime.now().isoformat()}'" if status == 'playing' else ''
            
            cursor.execute(
                f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.queue SET status = '{status}'{played_at} WHERE id = {queue_id}"
            )
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            queue_id = params.get('id')
            
            if not queue_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Queue ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.queue SET status = 'cancelled' WHERE id = {queue_id}"
            )
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
