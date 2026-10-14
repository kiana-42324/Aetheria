/** Adult representative portraits; appearance does not prescribe class, job or personality. */
export const portraitKeys=['human','elf','dwarf','beast','demon','dragon'] as const;
export function portraitUrl(race:number,sex:string){const key=portraitKeys[race]??'human';return `/portraits/${key}-${sex==='남성'?'male':'female'}.webp`}
