import sqlite3
from qdrant_client import QdrantClient

# Check SQLite database
print("=== SQLite Database ===")
conn = sqlite3.connect('recruitment.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM users')
user_count = cursor.fetchone()[0]
print(f"Users: {user_count}")

cursor.execute('SELECT id, email, role FROM users')
users = cursor.fetchall()
for user in users:
    print(f"  - ID: {user[0]}, Email: {user[1]}, Role: {user[2]}")

cursor.execute('SELECT COUNT(*) FROM resumes')
resume_count = cursor.fetchone()[0]
print(f"\nResumes: {resume_count}")

cursor.execute('SELECT id, candidate_id, file_name FROM resumes')
resumes = cursor.fetchall()
for resume in resumes:
    print(f"  - Resume ID: {resume[0]}, Candidate ID: {resume[1]}, File: {resume[2]}")

if resume_count > 0:
    cursor.execute('SELECT id, parsed_data FROM resumes LIMIT 1')
    resume_data = cursor.fetchone()
    print(f"\nSample resume data: {resume_data[1][:200] if resume_data[1] else 'No data'}...")

conn.close()

# Check Qdrant
print("\n=== Qdrant Vector Database ===")
try:
    qdrant = QdrantClient(host="localhost", port=6333)
    collections = qdrant.get_collections()
    print(f"Collections: {[c.name for c in collections.collections]}")
    
    if any(c.name == "resumes" for c in collections.collections):
        collection_info = qdrant.get_collection(collection_name="resumes")
        print(f"Resumes collection points: {collection_info.points_count}")
    else:
        print("No 'resumes' collection found")
        
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")
