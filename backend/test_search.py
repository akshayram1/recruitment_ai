from qdrant_client import QdrantClient
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

print("=== Testing Qdrant Search ===")

# Initialize services
qdrant = QdrantClient(host="localhost", port=6333)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Create a test query
query = "Find me candidates with AI and LangChain experience"
print(f"Query: {query}")

# Generate embedding for query
response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query
)
query_embedding = response.data[0].embedding
print(f"Generated embedding of length: {len(query_embedding)}")

# Search in Qdrant
results = qdrant.query_points(
    collection_name="resumes",
    query=query_embedding,
    limit=5,
    score_threshold=0.3
).points

print(f"\nSearch Results: {len(results)} candidates found")
for i, result in enumerate(results):
    print(f"\n{i+1}. Score: {result.score}")
    print(f"   ID: {result.id}")
    print(f"   Payload: {result.payload}")
