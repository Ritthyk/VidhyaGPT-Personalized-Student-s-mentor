import os.path
import chromadb
import whisper
from TTS.api import TTS
import re
from transformers import pipeline
from llama_index.core import (
    SimpleDirectoryReader, 
    VectorStoreIndex,
    PromptTemplate,
    set_global_tokenizer,
    Settings,
    StorageContext,
)
from transformers import AutoTokenizer
from llama_index.llms.llama_cpp import LlamaCPP
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.llama_cpp.llama_utils import (
    messages_to_prompt,
    completion_to_prompt,
)

tts_translator = pipeline("translation_en_to_hi", model="Helsinki-NLP/opus-mt-en-hi")
tts = TTS("Eadweard/xtts_kurisu").to('cuda')
stt_model = whisper.load_model("large")
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-large-en-v1.5")

import num2words
_number_re = re.compile(r'\d+')
def safe_num2words(number, lang="en"):
    try:
        # Replace 'cs' with 'cz' for Czech or handle other unsupported languages
        lang = "cz" if lang == "cs" else lang
        return num2words.num2words(number, lang=lang)
    except NotImplementedError:
        print(f"Language '{lang}' not supported by num2words.")
        return str(number) 

def translate_audio_hindi_to_english(audio_path):
    result = stt_model.transcribe(audio_path, task="translate", language="hi")
    translated_text = result["text"]
    print("Translated English Text:", translated_text)
    return translated_text

def initialize_conversation_bot():
    llm = LlamaCPP(
        model_url=None,
        model_path=r"K:\project-CMK\llama-2-7b-chat.Q8_0.gguf",
        temperature=0.3,
        max_new_tokens=512,
        # llama2 has a context window of 4096 tokens, but we set it lower to allow for some wiggle room
        context_window=3900,
        # set to at least 1 to use GPU
        model_kwargs={"n_gpu_layers": 100},
        # transform inputs into Llama2 format
        messages_to_prompt=messages_to_prompt,
        completion_to_prompt=completion_to_prompt,
        verbose=True,
    )

    set_global_tokenizer(
        AutoTokenizer.from_pretrained("NousResearch/Llama-2-7b-chat-hf").encode
    )

    Settings.chunk_size = 512
    Settings.chunk_overlap = 50

    global documents, vector_index, PERSIST_DIR, storage_context
    PERSIST_DIR = "./Storage"

    # load the documents and create the index
    documents = SimpleDirectoryReader("Data").load_data(show_progress=True)
    chroma_client = chromadb.EphemeralClient()
    chroma_collection = chroma_client.create_collection("etta-dt")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    vector_index = VectorStoreIndex.from_documents(documents, storage_context=storage_context, embed_model=embed_model)
    vector_index.storage_context.persist(persist_dir=PERSIST_DIR)

    template = (
        "You are Etta, a helpful and concise personal educational tutor."
        "Your goal is to provide short,  clear, and informative answers to study-related queries asked by your students"
        "Avoid unnecessary details, and keep responses concise and to the point.\n\n"
        "Here is some context related to the query:\n"
        "-----------------------------------------\n"
        "{context_str}\n"
        "-----------------------------------------\n"
        "Please respond to the following query concisely:\n"
        "User: {query_str}\n\n"
        "Limit your response to 2-3 sentences."
    )
    qa_template = PromptTemplate(template)
    memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
    query_engine = vector_index.as_chat_engine(
        chat_mode="context",
        llm=llm,
        memory=memory,
        system_prompt=qa_template,
    )

    return query_engine

def filter_tokens(text):
    cleaned_text = re.sub(r'\*.*?\*', '', text)
    cleaned_text = cleaned_text.replace('\\', '')
    return cleaned_text

def translate_and_synthesize(text):
    cleaned_text = filter_tokens(text)
    cleaned_text = re.sub(_number_re, lambda m: safe_num2words(int(m.group(0)), "en"), cleaned_text)
    translation = tts_translator(cleaned_text)[0]['translation_text']
    print("\n\nTranslation:",translation)
    tts.tts_to_file(text=translation, file_path="out.wav", speaker_wav=r"K:\project-CMK\kurisu_xtts\kurisu_en_example.wav", language="hi")

def update_index():
    documents = SimpleDirectoryReader("Data").load_data()
    vector_index = VectorStoreIndex.from_documents(documents, storage_context=storage_context, embed_model=embed_model)
    vector_index.storage_context.persist(persist_dir=PERSIST_DIR)

def chat_with_bot(query_engine, question):
    response_stream = query_engine.stream_chat(question)
    return response_stream

i=0
query_engine = initialize_conversation_bot()
while True:
    input_path = r"input\audio.mp3"
    if os.path.exists(input_path):
        i+=1
        response = chat_with_bot(query_engine, question:=translate_audio_hindi_to_english(input_path))
        os.remove(input_path)
        print(f"Audio-{i} deleted successfully.")
        text=""
        for token in response.response_gen:
             text+=token
             print(token, end="")
        print("\n\n\nText:",text)
        with open(r"output\output.txt", "w") as file:
            file.write(text)
        translate_and_synthesize(text)
    else:
        print("Audio does not exist.")
    
del response, query_engine
