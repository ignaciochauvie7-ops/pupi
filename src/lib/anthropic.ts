import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function askPupi(
  question: string,
  companyContext: object
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20251101',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Sos Pupi AI, el asistente
        inteligente de esta empresa.
        Respondé en español latino neutro,
        de forma clara y directa.

        Contexto de la empresa:
        ${JSON.stringify(companyContext)}

        Pregunta: ${question}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text
  }
  return 'No pude procesar tu pregunta.'
}
