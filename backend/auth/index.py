import json
import os
import psycopg2
import bcrypt
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для авторизации администраторов и столов караоке-системы'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        username = body.get('username')
        password = body.get('password')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username and password required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        
        if action == 'admin_login':
            cursor.execute(
                f"SELECT id, username, password_hash, role FROM {os.environ['MAIN_DB_SCHEMA']}.users WHERE username = '{username}'"
            )
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            if user[2] == 'temp_hash':
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                cursor.execute(
                    f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.users SET password_hash = '{hashed}' WHERE id = {user[0]}"
                )
                conn.commit()
                
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {'id': user[0], 'username': user[1], 'role': user[3]}
                    }),
                    'isBase64Encoded': False
                }
            
            if bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {'id': user[0], 'username': user[1], 'role': user[3]}
                    }),
                    'isBase64Encoded': False
                }
            else:
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
        
        elif action == 'table_login':
            cursor.execute(
                f"SELECT id, table_number, login, password_hash, expires_at, is_active FROM {os.environ['MAIN_DB_SCHEMA']}.tables WHERE login = '{username}' AND is_active = true"
            )
            table = cursor.fetchone()
            
            if not table:
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            expires_at = table[4]
            if datetime.now() > expires_at:
                cursor.execute(
                    f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.tables SET is_active = false WHERE id = {table[0]}"
                )
                conn.commit()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session expired'}),
                    'isBase64Encoded': False
                }
            
            if bcrypt.checkpw(password.encode('utf-8'), table[3].encode('utf-8')):
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'table': {
                            'id': table[0],
                            'table_number': table[1],
                            'login': table[2],
                            'expires_at': table[4].isoformat()
                        }
                    }),
                    'isBase64Encoded': False
                }
            else:
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
        
        else:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
