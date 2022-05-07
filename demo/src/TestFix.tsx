import FrePanel from './drag/FixPanel'

export default function TestFix() {
  return (
    <div>
      <FrePanel>
        <ul>
          {Array(100).fill("").map((_, i) => {
            return <li>{i}</li>
          })}
        </ul>
      </FrePanel>
    </div>
  )
}
