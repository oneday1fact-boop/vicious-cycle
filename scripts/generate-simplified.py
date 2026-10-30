#!/usr/bin/env python3
"""Regenerate the bundled Simplified Chinese edition with the local ICU converter.

The generated JSON is committed, so normal builds do not require ICU or a network.
Run this then export-native.cjs when Traditional Chinese content changes.
"""
import ctypes
from ctypes.util import find_library
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
libname=find_library('icui18n')
if not libname:
    raise SystemExit('Install ICU to regenerate Simplified Chinese; existing JSON remains buildable.')
lib=ctypes.CDLL(libname);suffix=libname.split('.')[-1]
open_fn=getattr(lib,'utrans_openU_'+suffix);open_fn.restype=ctypes.c_void_p
open_fn.argtypes=[ctypes.c_void_p,ctypes.c_int32,ctypes.c_int,ctypes.c_void_p,ctypes.c_int32,ctypes.c_void_p,ctypes.POINTER(ctypes.c_int32)]
convert=getattr(lib,'utrans_transUChars_'+suffix)
convert.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.POINTER(ctypes.c_int32),ctypes.c_int32,ctypes.c_int32,ctypes.POINTER(ctypes.c_int32),ctypes.POINTER(ctypes.c_int32)]
ident='Traditional-Simplified'.encode('utf-16-le');ident_buffer=ctypes.create_string_buffer(ident);error=ctypes.c_int32(0)
handle=open_fn(ident_buffer,len(ident)//2,0,None,0,None,ctypes.byref(error));assert handle and error.value<=0
data=json.loads((ROOT/'game/native-data.json').read_text());labels=json.loads((ROOT/'game/native-ui.json').read_text())
locale=data['languages']['zh'];locale['ui']={k:v[0] for k,v in data['ui'].items()};locale['nativeUi']=labels['zh'];locale['art']={k:v['name'] for k,v in data['art'].items()}
raw=json.dumps(locale,ensure_ascii=False,indent=2).encode('utf-16-le');capacity=len(raw)*2
buffer=ctypes.create_string_buffer(capacity);buffer[:len(raw)]=raw;length=ctypes.c_int32(len(raw)//2);limit=ctypes.c_int32(length.value);error=ctypes.c_int32(0)
convert(handle,buffer,ctypes.byref(length),capacity//2,0,ctypes.byref(limit),ctypes.byref(error));assert error.value<=0
result=json.loads(buffer.raw[:length.value*2].decode('utf-16-le'));assert result['ui']['title']=='恶性循环'
(ROOT/'game/locales/zh-Hans.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
getattr(lib,'utrans_close_'+suffix)(ctypes.c_void_p(handle))
print(f'Bundled Simplified Chinese: {len(result["story"])} scenes.')
