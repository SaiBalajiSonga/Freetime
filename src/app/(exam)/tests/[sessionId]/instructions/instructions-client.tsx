'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function InstructionsClient({ session }: { session: any }) {
  const [accepted, setAccepted] = useState(false)
  const router = useRouter()
  
  const isJee = session.mode === 'jee_mains'
  const title = isJee ? 'JEE (Main) – Mock Test Instructions' : 'Custom Mock Test Instructions'

  const handleProceed = () => {
    // Request fullscreen on click
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Could not enter fullscreen:', err)
      })
    }
    router.push(`/tests/${session.id}`)
  }

  return (
    <div className={`absolute inset-0 z-50 overflow-y-auto font-sans ${isJee ? 'bg-white text-gray-800' : 'bg-gray-900 text-gray-200'}`} style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className={`flex items-center px-4 py-3 border-b ${isJee ? 'border-gray-300 bg-[#1a1a2e] text-white' : 'border-gray-700 bg-gray-950 text-white'}`}>
        <Link href="/tests" className="mr-4 text-gray-300 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-sm font-bold">{title}</div>
      </div>

      <div className={`max-w-4xl mx-auto p-6 md:p-8 space-y-6 ${isJee ? 'bg-white' : 'bg-gray-900'}`}>
        <h1 className={`text-xl font-bold text-center mb-6 ${isJee ? '' : 'text-white'}`}>Please read the instructions carefully</h1>

        <div className={`space-y-4 text-sm leading-relaxed ${isJee ? 'text-gray-700' : 'text-gray-300'}`}>
          <h2 className={`font-bold text-lg underline ${isJee ? 'text-black' : 'text-white'}`}>General Instructions:</h2>
          
          <ol className="list-decimal pl-5 space-y-3">
            <li>Total duration of this Test is {session.time_limit_minutes} min.</li>
            <li>
              The clock will be set at the server. The countdown timer in the top middle of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
            </li>
            <li>
              The Questions Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:
              
              <div className="mt-4 space-y-3 pl-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 text-[11px] font-bold flex items-center justify-center flex-shrink-0 bg-[#e2e2e2] text-[#555] border border-[#ccc] rounded`}>1</div>
                  <span>You have not visited the question yet.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 text-[11px] font-bold flex items-center justify-center flex-shrink-0 bg-[#e53e3e] text-white [clip-path:polygon(0_0,100%_0,100%_75%,50%_100%,0_75%)]`}>2</div>
                  <span>You have not answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 text-[11px] font-bold flex items-center justify-center flex-shrink-0 bg-[#38a169] text-white [clip-path:polygon(0_0,75%_0,100%_50%,75%_100%,0_100%)]`}><span className="mr-1">3</span></div>
                  <span>You have answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 text-[11px] font-bold flex items-center justify-center flex-shrink-0 bg-[#805ad5] text-white rounded-full`}>4</div>
                  <span>You have NOT answered the question, but have marked the question for review.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 text-[11px] font-bold flex items-center justify-center flex-shrink-0 relative bg-[#805ad5] text-white rounded-full`}>
                    5<div className="absolute w-2.5 h-2.5 rounded-full bg-[#38a169] -bottom-0.5 -right-0.5 border border-white" />
                  </div>
                  <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                </div>
              </div>
            </li>
          </ol>

          <h2 className={`font-bold text-lg underline mt-8 ${isJee ? 'text-black' : 'text-white'}`}>Navigating to a Question:</h2>
          <ol className="list-decimal pl-5 space-y-3" start={4}>
            <li>
              To answer a question, do the following:
              <ul className="list-[lower-alpha] pl-6 mt-2 space-y-2">
                <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
                <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
              </ul>
            </li>
          </ol>

          <h2 className={`font-bold text-lg underline mt-8 ${isJee ? 'text-black' : 'text-white'}`}>Answering a Question:</h2>
          <ol className="list-decimal pl-5 space-y-3" start={5}>
            <li>
              Procedure for answering a multiple choice type question:
              <ul className="list-[lower-alpha] pl-6 mt-2 space-y-2">
                <li>To select your answer, click on the button of one of the options.</li>
                <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear</strong> button.</li>
                <li>To change your chosen answer, click on the button of another option.</li>
                <li>To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button.</li>
                <li>To mark the question for review, click on the <strong>Mark for Review &amp; Next</strong> button.</li>
              </ul>
            </li>
            <li>
              To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.
            </li>
          </ol>

          {/* Declaration */}
          <div className={`mt-8 pt-6 border-t ${isJee ? 'border-gray-300' : 'border-gray-700'}`}>
            <label className={`flex items-start gap-3 cursor-pointer p-4 rounded border ${isJee ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 cursor-pointer"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className={`text-sm leading-relaxed font-semibold ${isJee ? 'text-gray-700' : 'text-gray-200'}`}>
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-center pb-12">
            <div className="w-full max-w-sm">
              <button 
                onClick={handleProceed}
                disabled={!accepted} 
                className="w-full py-3 rounded text-white font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#5cb85c] hover:bg-[#4cae4c] flex items-center justify-center gap-2"
              >
                PROCEED
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
