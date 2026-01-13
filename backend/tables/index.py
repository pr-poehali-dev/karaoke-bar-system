import json
import os
import psycopg2
import bcrypt
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для управления столами караоке-бара (создание, удаление, список)'''
    
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
            cursor.execute(
                f"SELECT id, table_number, login, expires_at, is_active, created_at FROM {os.environ['MAIN_DB_SCHEMA']}.tables ORDER BY table_number"
            )
            tables = cursor.fetchall()
            
            result = []
            for table in tables:
                result.append({
                    'id': table[0],
                    'table_number': table[1],
                    'login': table[2],
                    'expires_at': table[3].isoformat(),
                    'is_active': table[4],
                    'created_at': table[5].isoformat()
                })
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tables': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            table_number = body.get('table_number')
            login = body.get('login')
            password = body.get('password')
            hours = body.get('hours', 2)
            admin_id = body.get('admin_id', 1)
            
            if not table_number or not login or not password:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Table number, login and password required'}),
                    'isBase64Encoded': False
                }
            
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            expires_at = datetime.now() + timedelta(hours=hours)
            
            cursor.execute(
                f"""
                INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.tables 
                (table_number, login, password_hash, expires_at, created_by) 
                VALUES ({table_number}, '{login}', '{hashed}', '{expires_at.isoformat()}', {admin_id})
                RETURNING id, table_number, login, expires_at, is_active
                """
            )
            new_table = cursor.fetchone()
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'table': {
                        'id': new_table[0],
                        'table_number': new_table[1],
                        'login': new_table[2],
                        'expires_at': new_table[3].isoformat(),
                        'is_active': new_table[4]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            table_id = body.get('id')
            table_number = body.get('table_number')
            login = body.get('login')
            password = body.get('password')
            hours = body.get('hours')
            
            if not table_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Table ID required'}),
                    'isBase64Encoded': False
                }
            
            updates = []
            if table_number:
                updates.append(f"table_number = {table_number}")
            if login:
                updates.append(f"login = '{login}'")
            if password:
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                updates.append(f"password_hash = '{hashed}'")
            if hours:
                expires_at = datetime.now() + timedelta(hours=int(hours))
                updates.append(f"expires_at = '{expires_at.isoformat()}'")
                updates.append("is_active = true")
            
            if updates:
                query = f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.tables SET {', '.join(updates)} WHERE id = {table_id} RETURNING id, table_number, login, expires_at, is_active"
                cursor.execute(query)
                updated = cursor.fetchone()
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'table': {
                            'id': updated[0],
                            'table_number': updated[1],
                            'login': updated[2],
                            'expires_at': updated[3].isoformat(),
                            'is_active': updated[4]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No fields to update'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            table_id = params.get('id')
            
            if not table_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Table ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.tables SET is_active = false WHERE id = {table_id}"
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