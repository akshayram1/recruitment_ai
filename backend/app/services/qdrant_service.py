"""Qdrant vector database service"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import (
    Distance, VectorParams, PointStruct, 
    Filter, FieldCondition, MatchValue
)

from app.config import get_settings

settings = get_settings()


class QdrantService:
    """Service for Qdrant vector database operations"""
    
    # Collection names
    RESUMES_COLLECTION = "resumes"
    JOBS_COLLECTION = "jobs"
    
    # Embedding dimensions for text-embedding-3-small
    VECTOR_SIZE = 1536
    
    def __init__(self):
        self.client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key if settings.qdrant_api_key else None
        )
    
    def initialize_collections(self):
        """Initialize Qdrant collections if they don't exist"""
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        # Create resumes collection
        if self.RESUMES_COLLECTION not in collection_names:
            self.client.create_collection(
                collection_name=self.RESUMES_COLLECTION,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Created collection: {self.RESUMES_COLLECTION}")
        
        # Create jobs collection
        if self.JOBS_COLLECTION not in collection_names:
            self.client.create_collection(
                collection_name=self.JOBS_COLLECTION,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Created collection: {self.JOBS_COLLECTION}")
    
    def upsert_resume(
        self,
        resume_id: UUID,
        candidate_id: UUID,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> bool:
        """Upsert a resume embedding to Qdrant"""
        point = PointStruct(
            id=str(resume_id),
            vector=embedding,
            payload={
                "candidate_id": str(candidate_id),
                "type": "resume",
                **metadata
            }
        )
        
        self.client.upsert(
            collection_name=self.RESUMES_COLLECTION,
            points=[point]
        )
        return True
    
    def upsert_job(
        self,
        job_id: UUID,
        recruiter_id: UUID,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> bool:
        """Upsert a job embedding to Qdrant"""
        point = PointStruct(
            id=str(job_id),
            vector=embedding,
            payload={
                "recruiter_id": str(recruiter_id),
                "type": "job",
                **metadata
            }
        )
        
        self.client.upsert(
            collection_name=self.JOBS_COLLECTION,
            points=[point]
        )
        return True
    
    def search_candidates(
        self,
        query_embedding: List[float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        score_threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Search for candidates using semantic similarity"""
        filter_conditions = None
        
        if filters:
            conditions = []
            for key, value in filters.items():
                if isinstance(value, list):
                    # Handle list filters (e.g., skills)
                    for v in value:
                        conditions.append(
                            FieldCondition(
                                key=f"metadata.{key}",
                                match=MatchValue(value=v)
                            )
                        )
                else:
                    conditions.append(
                        FieldCondition(
                            key=f"metadata.{key}",
                            match=MatchValue(value=value)
                        )
                    )
            if conditions:
                filter_conditions = Filter(must=conditions)
        
        # First search without threshold to see all scores
        all_results = self.client.query_points(
            collection_name=self.RESUMES_COLLECTION,
            query=query_embedding,
            limit=limit,
            query_filter=filter_conditions
        ).points
        
        print(f"[DEBUG] All Qdrant results (no threshold): {len(all_results)}")
        for r in all_results:
            print(f"  - ID: {r.id}, Score: {r.score:.4f}, Above threshold ({score_threshold}): {r.score >= score_threshold}")
        
        # Filter by score threshold
        results = [r for r in all_results if r.score >= score_threshold]
        
        return [
            {
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            }
            for result in results
        ]
    
    def search_jobs(
        self,
        query_embedding: List[float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        score_threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Search for jobs using semantic similarity"""
        filter_conditions = None
        
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(
                        key=f"metadata.{key}",
                        match=MatchValue(value=value)
                    )
                )
            if conditions:
                filter_conditions = Filter(must=conditions)
        
        # First search without threshold to see all scores
        all_results = self.client.query_points(
            collection_name=self.JOBS_COLLECTION,
            query=query_embedding,
            limit=limit,
            query_filter=filter_conditions
        ).points
        
        print(f"[DEBUG] All Qdrant job results (no threshold): {len(all_results)}")
        for r in all_results:
            print(f"  - ID: {r.id}, Score: {r.score:.4f}, Above threshold ({score_threshold}): {r.score >= score_threshold}")
        
        # Filter by score threshold
        results = [r for r in all_results if r.score >= score_threshold]
        
        return [
            {
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            }
            for result in results
        ]
    
    def get_resume_by_id(self, resume_id: UUID) -> Optional[Dict[str, Any]]:
        """Get a resume by ID"""
        results = self.client.retrieve(
            collection_name=self.RESUMES_COLLECTION,
            ids=[str(resume_id)]
        )
        
        if results:
            return {
                "id": results[0].id,
                "payload": results[0].payload
            }
        return None
    
    def get_job_by_id(self, job_id: UUID) -> Optional[Dict[str, Any]]:
        """Get a job by ID"""
        results = self.client.retrieve(
            collection_name=self.JOBS_COLLECTION,
            ids=[str(job_id)]
        )
        
        if results:
            return {
                "id": results[0].id,
                "payload": results[0].payload
            }
        return None
    
    def delete_resume(self, resume_id: UUID) -> bool:
        """Delete a resume from Qdrant"""
        self.client.delete(
            collection_name=self.RESUMES_COLLECTION,
            points_selector=models.PointIdsList(
                points=[str(resume_id)]
            )
        )
        return True
    
    def delete_job(self, job_id: UUID) -> bool:
        """Delete a job from Qdrant"""
        self.client.delete(
            collection_name=self.JOBS_COLLECTION,
            points_selector=models.PointIdsList(
                points=[str(job_id)]
            )
        )
        return True
