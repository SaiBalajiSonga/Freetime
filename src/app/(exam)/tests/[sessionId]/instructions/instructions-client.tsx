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
    <div className="absolute inset-0 z-50 overflow-y-auto font-sans bg-[#eef2f5] text-[#333]" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b bg-[#1a4b93] border-[#12366b] text-white shadow-sm">
        <Link href="/tests" className="mr-4 text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-sm font-bold">{title}</div>
      </div>

      <div className="w-[96%] max-w-6xl mx-auto my-4 p-4 md:p-6 bg-white shadow-sm border border-[#c5d0e0]">
        <h1 className="text-[18px] font-bold text-center mb-4 text-[#000]">Please read the instructions carefully</h1>

        <div className="text-[14px] leading-[1.5] text-[#000]">
          <h2 className="font-bold underline mb-2">General Instructions:</h2>
          
          <ol className="list-decimal pl-5 space-y-1.5 mb-6">
            <li>Total duration of this Test is {session.time_limit_minutes} min.</li>
            <li>
              The clock will be set at the server. The countdown timer in the top middle of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
            </li>
            <li>
              The Questions Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:
              
              <div className="mt-2 space-y-1 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[30px] text-[13px] font-bold flex items-center justify-center shrink-0 bg-[#e2e2e2] text-[#555] border border-[#ccc] rounded">1</div>
                  <span>You have not visited the question yet.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[30px] text-[13px] font-bold flex items-center justify-center shrink-0 bg-[#e53e3e] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]">2</div>
                  <span>You have not answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[30px] text-[13px] font-bold flex items-center justify-center shrink-0 bg-[#38a169] text-white [clip-path:polygon(0_15%,100%_0,100%_100%,0_85%)]"><span className="mr-0.5">3</span></div>
                  <span>You have answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[30px] text-[13px] font-bold flex items-center justify-center shrink-0 bg-[#805ad5] text-white rounded-full">4</div>
                  <span>You have NOT answered the question, but have marked the question for review.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[30px] text-[13px] font-bold flex items-center justify-center shrink-0 relative bg-[#805ad5] text-white rounded-full">
                    5<div className="absolute w-2 h-2 rounded-full bg-[#38a169] -bottom-0.5 -right-0.5 border border-white" />
                  </div>
                  <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                </div>
              </div>
            </li>
          </ol>

          <h2 className="font-bold underline mb-2">Navigating to a Question:</h2>
          <ol className="list-decimal pl-5 space-y-1.5 mb-6" start={4}>
            <li>
              To answer a question, do the following:
              <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
                <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
              </ul>
            </li>
          </ol>

          <h2 className="font-bold underline mb-2">Answering a Question:</h2>
          <ol className="list-decimal pl-5 space-y-1.5 mb-6" start={5}>
            <li>
              Procedure for answering a multiple choice type question:
              <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                <li>To select your answer, click on the button of one of the options.</li>
                <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button.</li>
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
          <div className="mt-8 pt-4 border-t border-[#c5d0e0]">
            <label className="flex items-start gap-2 cursor-pointer p-3 bg-[#f8f9fa] border border-[#d1d9e6]">
              <input 
                type="checkbox" 
                className="mt-1 w-3.5 h-3.5 cursor-pointer shrink-0"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className="text-[13px] leading-[1.4] font-semibold text-[#000]">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-center pb-4">
            <div className="w-full max-w-sm">
              <button 
                onClick={handleProceed}
                disabled={!accepted} 
                className="w-full py-2.5 text-white font-bold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#1a4b93] hover:bg-[#12366b] flex items-center justify-center uppercase"
              >
                Proceed
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
