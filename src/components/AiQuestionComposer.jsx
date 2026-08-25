export default function AiQuestionComposer({ question, isSending, onChange, onSubmit }) {
  return (
    <form className="ai-assistant-composer" onSubmit={onSubmit}>
      <textarea
        value={question}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        placeholder="Pergunte sobre seus gastos..."
        maxLength={500}
        rows={3}
        aria-label="Pergunta para o assistente financeiro"
      />
      <div className="ai-assistant-composer-footer">
        <small>As respostas usam apenas os dados da sua conta.</small>
        <button type="submit" className="primary-button" disabled={isSending || question.trim().length < 3}>
          {isSending ? 'Consultando...' : 'Perguntar'}
        </button>
      </div>
    </form>
  )
}
