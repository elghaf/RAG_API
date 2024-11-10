"use client"
import Image from "next/image"
import ragllmlogo from "./assets/LOGO.png"
import {useChat} from "ai/react"
import {Message} from "ai"

const Home = () => {
    const noMessages = true
    const {input, handleInputChange, handleSubmit, append, isLoading,messages} = useChat()
    return (
        <main>
            <Image src={ragllmlogo} width="250" alt="ragllmlogo"/>
            <section className={noMessages? "": "populated"}>
                {noMessages ? (
                    <>
                    <p className="starter-text">Ultimate place for Formula one</p>
                    <br/>
                    {/* <PromptSuggestionRow/> */}
                    </>
                ):(
                <>
                {/* map messages onto text bubbles */}
                {/* <LoadingBubble/> */}
                </>
                )}
                
            </section>
            <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something ...."/>
                    
                    <input type="submit"/>

                </form>
        </main>
    )
}


export default Home