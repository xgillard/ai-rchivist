'''
Utilities meant to ease the interaction with huggingface API
'''
from __future__ import annotations
import os

from huggingface_hub import login, logout


class ResettableEnv:
    '''
    An overriding descriptor that purposedly sets and resets the value of an
    environment variable.
    '''
    def __init__(self):
        self._name = None
        self._reset = None

    def __set_name__(self, managed_class, name: str):
        self._name = name

    def __get__(self, instance, cls) -> str:
        return None if self._name not in os.environ else os.environ[self._name]

    def __set__(self, instance, value: str):
        if value:
            if self._reset is None:
                self._reset = self.__get__(instance, type(instance))
            os.environ[self._name] = value
        elif self._name in os.environ:
            del os.environ[self._name]

    def __delete__(self, instance):
        if self._reset is not None:
            os.environ[self._name] = self._reset


class HuggingFace:
    '''
    A context manager to interact with huggingfaces api without having to
    explicitly think of logging in and out as needed.
    '''
    TRANSFORMERS_CACHE = ResettableEnv()
    HF_INFERENCE_ENDPOINT = ResettableEnv()
    HF_HOME = ResettableEnv()
    HF_HUB_CACHE = ResettableEnv()
    HF_ASSETS_CACHE = ResettableEnv()
    HF_TOKEN = ResettableEnv()
    HF_TOKEN_PATH = ResettableEnv()
    HF_HUB_VERBOSITY = ResettableEnv()
    HF_HUB_ETAG_TIMEOUT = ResettableEnv()
    HF_HUB_DOWNLOAD_TIMEOUT = ResettableEnv()
    HF_HUB_OFFLINE = ResettableEnv()
    HF_HUB_DISABLE_PROGRESS_BARS = ResettableEnv()
    HF_HUB_DISABLE_SYMLINKS_WARNING = ResettableEnv()
    HF_HUB_DISABLE_EXPERIMENTAL_WARNING = ResettableEnv()
    HF_HUB_DISABLE_TELEMETRY = ResettableEnv()
    HF_HUB_ENABLE_HF_TRANSFER = ResettableEnv()

    def __init__(self, **kwargs):
        '''
        The following kwargs can be set, and their meaning corresponds to that
        described in the huggingface environment variables doc
        [here](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables):

            * transformers_cache
            * hf_inference_endpoint
            * hf_home
            * hf_hub_cache
            * hf_assets_cache
            * hf_token
            * hf_token_path
            * hf_hub_verbosity
            * hf_hub_etag_timeout
            * hf_hub_download_timeout
            * hf_hub_offline
            * hf_hub_disable_progress_bars
            * hf_hub_disable_symlinks_warning
            * hf_hub_disable_experimental_warning
            * hf_hub_disable_telemetry
            * hf_hub_enable_hf_transfer
        '''
        super().__init__()
        self.kwargs = kwargs.keys()
        for k, v in kwargs.items():
            setattr(self, k.upper(), v)

    def __enter__(self):
        login(token=self.HF_TOKEN)
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        for k in self.kwargs:
            setattr(self, k.upper(), None)
        logout()
        for k in self.kwargs:
            delattr(self, k.upper())
