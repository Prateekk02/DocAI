'use client'
import React, { useState } from 'react'
import axios from 'axios'
import {toast} from 'react-toastify'


const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Hero = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [answer, setAnswer] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [indexed, setIndexed] = useState(false);

    const handleUpload = async () => {
        if(!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try{
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            });
            toast.success(`Indexed ${response.data.chunks} chunks`);
            setIndexed(true);        
        }catch(error){
            toast.error("Upload failed");
            console.log(error);

        }finally{
            setUploading(false);
        }
    }

    const handleAsk = async () =>{
        if(!question) return;

        setAsking(true);
        setAnswer('');
        setSources([]);

        try{
            const response = await axios.post(`${API_URL}/ask`, {question});
            setAnswer(response.data.answer);
            setSources(response.data.sources || [] );
        }catch(error){
            toast.error("Question failed");
            console.log(error);
        }finally{
            setAsking(false);
        }
    }


 
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            QuickDoc AI 📚
          </h1>
          <p className="text-gray-600">Upload PDFs. Ask Questions. Get Answers.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            1️⃣ Upload PDF
          </h2>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 p-3 border-2 text-black border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Indexing...' : 'Upload'}
            </button>
          </div>
          {indexed && (
            <p className="mt-3 text-green-600 font-medium">✓ Document indexed!</p>
          )}
        </div>

        {/* Question Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
             Ask Questions
          </h2>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="What would you like to know?"
              className="flex-1 p-3 border-2 text-black border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleAsk}
              disabled={!question || asking || !indexed}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {asking ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {/* Answer Display */}
          {answer && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-600">
                <h3 className="font-semibold text-gray-800 mb-2">Answer:</h3>
                <p className="text-gray-700 leading-relaxed">{answer}</p>
              </div>

              {sources.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3">Sources:</h3>
                  {sources.map((source, idx) => (
                    <div key={idx} className="mb-3 p-3 bg-white rounded-lg text-sm text-gray-600 border border-gray-200">
                      {source.substring(0, 200)}...
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero