import {names,surnames} from './world';
interface NamePool {given:string[];family:string[];inspiration:string}
const list=(text:string)=>text.split(' ');
// Cultural inspiration for fictional characters, not a reconstruction of real
// historical naming rules. Keep given-name / family-name order for every race.
// Human arrays are reused verbatim. Surnames are single tokens for inheritance.
export const raceNamePools:NamePool[]=[
 {given:names,family:surnames,inspiration:'기존 인간 이름'},
 {inspiration:'라틴어·로마식 이름',
 given:list('아우렐리우스 루키우스 율리우스 마르쿠스 가이우스 티베리우스 옥타비우스 발레리우스 카시우스 플라비우스 클라우디우스 세베루스 펠릭스 실바누스 퀸투스 티투스 아우렐리아 루키아 율리아 클라우디아 옥타비아 발레리아 플라비아 코르넬리아 리비아 세실리아 파비아 사비나 마르키아 세레나 알바 실비아'),
 family:list('아우렐리안 실바누스 발레리안 플로루스 루멘 알투스 루키디우스 베리디스 아르보르 스텔라 몬타누스 카엘룸')},
 {inspiration:'그리스어 이름',
 given:list('니콜라오스 디미트리오스 게오르기오스 알렉산드로스 안드레아스 테오도로스 콘스탄티노스 스피리돈 레오니다스 필리포스 아킬레아스 오디세아스 크리스토스 페트로스 이아손 소크라테스 엘레니 소피아 테오도라 아테나 디미트라 칼리오페 이리니 알렉산드라 카테리나 아리아드니 페넬로피 니키 다프니 멜리나 탈리아 크리산티'),
 family:list('파파도풀로스 니콜라이디스 게오르기우 디미트리우 안드레우 테오도리디스 페트리디스 마브로스 칼로게로스 스타브로스 시데리스 아르기로스')},
 {inspiration:'일본어 이름',
 given:list('하루토 유토 소타 렌 미나토 리쿠 유키 아키라 하루 히나타 카이토 타쿠미 나오키 이츠키 소라 타이치 사쿠라 유이 아오이 히나 미오 린 나나미 아카리 코하루 시오리 스미레 유즈키 호타루 카에데 츠바키 미즈키'),
 family:list('아마미야 시라카와 모리야마 타카하시 사쿠라이 후지사키 카자마 미나세 츠키시로 아키야마 호시노 키리시마')},
 {inspiration:'신화·전승의 악마 이름을 차용한 판타지 이름',
 given:list('아스모데우스 아자젤 벨리알 아스타로트 메피스토펠레스 바엘 파이몬 부에르 바르바토스 부네 오로바스 아몬 아미 푸르손 마르바스 베리트 발라크 안드라스 샤크스 가미긴 포르네우스 로노베 비네 발람 자간 오세 시트리 그레모리 단탈리온 릴리스 나아마 아그라트'),
 family:list('녹스 움브라 옵시디안 테네브라 아트라 모르비스 베스페르 에레보스 칼리고 녹티스 오르쿠스 바르칸')},
 {inspiration:'프랑스어 이름',
 given:list('루이 앙리 샤를 쥘 피에르 에티엔 가브리엘 라파엘 루시앙 세바스티앵 앙투안 로랑 올리비에 테오도르 레미 막심 엘로디 카미유 클로에 아멜리 셀린 클레르 마농 플뢰르 이네스 마들렌 오렐리 비비엔 줄리에트 마르그리트 솔렌 에밀리'),
 family:list('뒤부아 모로 로랑 르페브르 드라크루아 보몽 퐁텐 뒤퐁 슈발리에 로슈포르 몽클레르 드라로슈')}
];
