export type FaqItem = {
  question: string
  answer: string
}

type FaqAccordionProps = {
  title: string
  description?: string
  items: FaqItem[]
}

const FaqAccordion = ({ title, description, items }: FaqAccordionProps) => (
  <section className="space-y-6 py-12">
    <div>
      <h2 className="text-3xl font-bold text-gray-950">{title}</h2>
      {description ? <p className="mt-3 text-base leading-8 text-gray-700">{description}</p> : null}
    </div>
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-lg border border-gray-200 bg-white p-5"
          open
        >
          <summary className="cursor-pointer list-none text-lg font-semibold text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2">
            <span className="inline-flex w-full items-center justify-between gap-4">
              {item.question}
              <span className="text-xl leading-none text-gray-500 group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-base leading-7 text-gray-700">{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
)

export default FaqAccordion
