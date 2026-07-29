declare module 'petrovich' {
  interface PetrovichPerson {
    gender?: 'male' | 'female' | 'androgynous'
    first?: string
    middle?: string
    last?: string
  }
  export default function petrovich(person: PetrovichPerson, gcase?: string): PetrovichPerson
}
