import { describe, expect, it } from 'vitest'
import { questionFocus, readablePassage, revisedPassages, sectionPassages, unresolvedOutcomes } from './reviewEdits'
import type { ReviewReport } from '../api/reviewReport'

const report: ReviewReport = { schemaVersion: '3', scope: 'SELECTED_PASSAGES', priorities: [], edits: [{id:'m',operation:'move',section:'Employer',before:'Cost result.',after:'Cost result.',insertAfter:'Recovery result.',reason:'Place with employer.',sourceQuotes:['Cost result.'],requirementIds:[]}], sections:[{heading:'Employer',editIds:['m'],retained:[{text:'First result.',sourceQuote:'First result.'},{text:'Recovery result.',sourceQuote:'Recovery result.'}],items:[{editId:'',retainedIndex:0,sourceStart:10,sourceEnd:20},{editId:'',retainedIndex:1,sourceStart:30,sourceEnd:40},{editId:'m',retainedIndex:-1,sourceStart:40,sourceEnd:40}]}] }

describe('report fixes',()=>{
  it('uses server source ordering for both rendered passages and copy',()=>{
    const texts=sectionPassages(report.sections![0],report,new Set()).map(x=>x.text)
    expect(texts).toEqual(['First result.','Recovery result.','Cost result.'])
    const copy=revisedPassages(report,new Set())
    expect(copy.indexOf('Recovery result.')).toBeLessThan(copy.indexOf('Cost result.'))
    expect(sectionPassages(report.sections![0],report,new Set(['m'])).map(x=>x.text)).not.toContain('Cost result.')
    expect(revisedPassages(report,new Set(['m']))).toContain('Kept in original resume')
  })
  it('makes retained PDF text readable without changing words',()=>{
    expect(readablePassage('Performed root\n-\ncause analysis.')).toBe('Performed root-cause analysis.')
    expect(readablePassage('Costs fell by 20%.')).toBe('Costs fell by 20%.')
  })
  it('shows one focused ask while keeping the original available',()=>{
    expect(questionFocus('What did you implement, and which tests did you lead? Give details.')).toBe('What did you implement?')
    expect(questionFocus('When did you first use Terraform professionally? Did you use CloudFormation?')).toBe('When did you first use Terraform professionally?')
    expect(questionFocus('Have you used Terraform professionally, or performed Linux administration?')).toBe('Have you used Terraform professionally?')
    expect(questionFocus('For a recent component, what did you personally implement, and which tests did you lead?')).toBe('For a recent component, what did you personally implement?')
    expect(questionFocus('Describe one implementation.')).toBe('Describe one implementation.')
  })
  it('separates explicit preferences without guessing about ambiguous legacy gaps',()=>{
    const out=unresolvedOutcomes({...report,outcomes:{clearerNow:[],needsConfirmation:[],stillUnresolved:['Required Terraform tenure.','Preferred AWS certification.','No AWS certificate shown.'],optionalImprovements:['Multi-cloud breadth.']}})
    expect(out.required).toEqual(['Required Terraform tenure.','No AWS certificate shown.'])
    expect(out.optional).toEqual(['Multi-cloud breadth.','Preferred AWS certification.'])
  })
})
