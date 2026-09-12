'use client';
import { useMemo } from 'react';
const thoughts=[
 ['It always seems impossible until it’s done.','Nelson Mandela'],
 ['The future depends on what you do today.','Mahatma Gandhi'],
 ['Great things are done by a series of small things brought together.','Vincent van Gogh'],
 ['The important thing is not to stop questioning.','Albert Einstein'],
 ['Success is not final; failure is not fatal: it is the courage to continue that counts.','Winston Churchill'],
 ['What you do every day matters more than what you do once in a while.','TruxPylot'],
 ['Build quietly. Improve daily. Let the work become your introduction.','TruxPylot'],
 ['A difficult season can still be the place where your strongest future begins.','TruxPylot'],
 ['Ideas become valuable when discipline gives them a way to exist.','TruxPylot'],
 ['Do not measure your beginning against someone else’s finished chapter.','TruxPylot'],
];
export function DailyThought(){const thought=useMemo(()=>{const day=Math.floor(Date.now()/86400000);return thoughts[day%thoughts.length]},[]);return <section className="daily-thought"><div className="daily-thought-mark">✦</div><div><p className="page-kicker">TODAY&apos;S THOUGHT</p><blockquote>“{thought[0]}”</blockquote><small>— {thought[1]}</small></div></section>}
