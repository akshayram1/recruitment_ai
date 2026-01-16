"""YAML prompt loader utility"""
import os
from typing import Dict, Any, Optional
from pathlib import Path
import yaml


class PromptManager:
    """Manager for loading and caching YAML prompts"""
    
    _cache: Dict[str, Dict[str, Any]] = {}
    _prompts_dir: Path = Path(__file__).parent
    
    @classmethod
    def load_prompt(cls, name: str, version: str = "default") -> Dict[str, Any]:
        """Load a prompt from YAML file"""
        cache_key = f"{name}:{version}"
        
        if cache_key in cls._cache:
            return cls._cache[cache_key]
        
        file_path = cls._prompts_dir / f"{name}.yaml"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {file_path}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            prompts = yaml.safe_load(f)
        
        # Get versioned prompt or default
        if version in prompts:
            prompt_data = prompts[version]
        elif "default" in prompts:
            prompt_data = prompts["default"]
        else:
            prompt_data = prompts
        
        cls._cache[cache_key] = prompt_data
        return prompt_data
    
    @classmethod
    def get_system_prompt(cls, name: str, version: str = "default", **kwargs) -> str:
        """Get system prompt with variable interpolation"""
        prompt_data = cls.load_prompt(name, version)
        system_prompt = prompt_data.get("system", "")
        
        # Interpolate variables
        for key, value in kwargs.items():
            system_prompt = system_prompt.replace(f"{{{{{key}}}}}", str(value))
        
        return system_prompt
    
    @classmethod
    def get_user_prompt(cls, name: str, version: str = "default", **kwargs) -> str:
        """Get user prompt template with variable interpolation"""
        prompt_data = cls.load_prompt(name, version)
        user_prompt = prompt_data.get("user", "")
        
        # Interpolate variables
        for key, value in kwargs.items():
            user_prompt = user_prompt.replace(f"{{{{{key}}}}}", str(value))
        
        return user_prompt
    
    @classmethod
    def clear_cache(cls):
        """Clear the prompt cache"""
        cls._cache = {}
