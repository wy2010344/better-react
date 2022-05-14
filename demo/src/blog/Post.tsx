export default function Post() {
  return (
    <div css={`
    
    height:100%;
    overflow:auto;
    `}>
    <div className="header" css={`
    --header-height:72px;
    height:var(--header-height);
    background-color:red;
    position:sticky;
    top:0;
    `}></div>
    <div className="body" css={`
    height:3000px;
    background:green;
    display:flex;
    `}>
      <div className="left" css={`
        width:320px;
        position:sticky;
        top:var(--header-height);
        background:blue;
        height:200px;
      `}>
      </div>
      <div className="center" css={`
      flex:1;
      background:yellow;
      `}>

      </div>
      <div className="right" css={`
      width:320px;
      background:black;
      `}>
        </div>
    </div>
    </div>
  )
}
