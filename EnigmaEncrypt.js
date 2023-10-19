const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Enigma Configuration
const rotorOrder = [0, 0, 0]; // Order of rotors
const rotorPositions = [0, 0, 0]; // Initial positions of rotors

const plugboard = 'RBCDEFKHIJGLMNXPQASTUVWOYZ'


const reflector = 'EJMZALYXVBWFCRQUONTSPIKHGD'

const rotorWiring = [
  'BDFHJLCPRTXVZNYEIWGAKMUSQO',
  'AJDKSIRUXBLHWTMCQGZNPYFVOE',
  'EKMFLGDQVZNTOWYHXUSPAIBRCJ'
]; 


// Genetic Algorithm Parameters
// const populationSize = 17576;
let history = []
const populationSize = 5;
const maxGenerations = 1000;
const mutationRate = 0.1;

const encryptedMessage = 'NXAWS'

/**
 * ------------------------------------------------------------------------
 * !Enigma Configuration 
 */


function rotorSubstitution(idx, alphabet, rotorPosition, wiringOutput){
    const shiftedRotor = alphabet.slice(rotorPosition) + alphabet.slice(0, rotorPosition);
    let word = wiringOutput[idx]
    // console.log(`in index ${idx} got word ${word} and got index ${shiftedRotor.indexOf(word)} from alphabet`)
    return shiftedRotor.indexOf(word)
}

function reflectorSubstitution(idx, alphabet, wiringOutput){
    let word = wiringOutput[idx]
    // console.log(`\nin index ${idx} got word ${word} and got index ${alphabet.indexOf(word)} from alphabet`)
    // console.log(`reflector effect got word ${wiringOutput[alphabet.indexOf(word)]} from wiring Output\n`)
    return alphabet.indexOf(word)
}

function revRotorSubstitution(idx, alphabet, rotorPosition, wiringOutput){
    const shiftedRotor = alphabet.slice(rotorPosition) + alphabet.slice(0, rotorPosition);
    let word = shiftedRotor[idx]
    // console.log(`in index ${idx} got word ${word} and got index ${wiringOutput.indexOf(word)} from wiring Output`)
    return wiringOutput.indexOf(word)
}

function plugboardSubtitution(word, plugboardWiring){
  return plugboardWiring.indexOf(word)
}

function Outputplugboard(idx, plugboardWiring){
  return plugboardWiring[idx]
}

function Rotors(word, rotorPosition) {
    let alphabet = ALPHABET
    let wiring =  rotorWiring
    let plugboardWiring = plugboard
    let reflectorWiring = reflector
    let idx = 0

    idx = plugboardSubtitution(word, plugboardWiring)
    // console.log(`word ${word} become ${plugboardWiring[idx]} witd index of ${idx}`)
    idx = rotorSubstitution(idx, alphabet, rotorPosition[0], wiring[0])
    idx = rotorSubstitution(idx, alphabet, rotorPosition[1], wiring[1])
    idx = rotorSubstitution(idx, alphabet, rotorPosition[2], wiring[2])
    
    idx = reflectorSubstitution(idx, alphabet, reflectorWiring)

    //reverse encryption
    idx = revRotorSubstitution(idx, alphabet, rotorPosition[2], wiring[2])
    idx = revRotorSubstitution(idx, alphabet, rotorPosition[1], wiring[1])
    idx = revRotorSubstitution(idx, alphabet, rotorPosition[0], wiring[0])
    
    word = Outputplugboard(idx, plugboardWiring)
    // console.log(`\ngot output ${word}`)
    return word
}

function enigmadecrypt(config,message){
    message = message.toUpperCase()
    let result = ""
    let rotate = 0
    for(let i of message){
        result += Rotors(i,config)
        rotate++
        if(rotate >= message.length){
          break
        }else{
          if(config[0] >= 25){
            if(config[1] >= 25){
              config[2]++
            }else{
              config[1]++
            }
          }
          config[0]++
        }
    }
    return result
}



/**
 * ------------------------------------------------------------------------
 * !Genetic Algorithm  
 */


function sequentialSort(individual, fitnessValues) {
  const n = fitnessValues.length;
  let swapped;

  do {
    swapped = false;
    for (let i = 0; i < n - 1; i++) {
      if (fitnessValues[i] > fitnessValues[i + 1]) {
        // Swap elements if they are in the wrong order
        [fitnessValues[i], fitnessValues[i + 1]] = [fitnessValues[i + 1], fitnessValues[i]];
        [individual[i], individual[i + 1]] = [individual[i + 1], individual[i]];
        swapped = true;
      }
    }
  } while (swapped);

  return individual;
}

function fitnessCheck(individual){
    let input = encryptedMessage
    // console.log(`individual : ${individual}`)
    individual = individual.slice()
    let decryptedMessage = enigmadecrypt(individual, input)

    let totalDistance = 0
    for(let i = 0; i < input.length; i++){
      totalDistance += Math.abs(ALPHABET.indexOf(input[i]) - ALPHABET.indexOf(decryptedMessage[i]))
    }

    return totalDistance
}

function GenerateIndividual(){
    let individual = []
    for(let i = 0; i < rotorOrder.length; i++){
        individual.push(parseInt(Math.random() * 26))
    }
    return individual
}

function selection(population, fitnessValues) {
  const selectedParents = [];
  for (let i = 0; i < populationSize; i++) {
    const randomIndex1 = Math.floor(Math.random() * populationSize);
    const randomIndex2 = Math.floor(Math.random() * populationSize);
    const parent1 = population[randomIndex1];
    const parent2 = population[randomIndex2];
    const fitness1 = fitnessValues[randomIndex1];
    const fitness2 = fitnessValues[randomIndex2];
    selectedParents.push(fitness1 < fitness2 ? parent1 : parent2);
  }
  
  return sequentialSort(selectedParents, selectedParents.map(fitnessCheck));
}

// Crossover function (e.g., single-point crossover)
function crossover(parents) {
  const offspring = parents;
  for (let i = 1; i < parents.length; i++) {
    const parent1 = parents[i];
    const parent2 = parents[(i + 1) % parents.length];
    const child = [...parent1.slice(0,2), ...parent2.slice(2)];
    offspring[i] = child;
  }

  return offspring;
}

// Mutation function
function mutation(offspring) {
  let sum = 0;
  let mean = 0;
  let mutatedOffspring = [];
  let fitnessValues = offspring.map(fitnessCheck);

  for (let a of fitnessValues) {
    sum += a;
  }
  mean = parseInt(sum / fitnessValues.length);

  for (let idx in offspring) {
    let temp = [0, 0, 0];
    let gen = parseInt(Math.random() * 3);

    if (Math.random() < 0.8) {
      if (fitnessValues[idx] < mean && Math.random() < 0.05) {
        if (history.length < offspring.length) {
          offspring[idx][gen] += 1;
          temp[gen] = 1;
          history.push(temp);
          mutatedOffspring.push(offspring[idx]);
        } else {
          if (idx >= 0 && idx < history.length && gen >= 0 && gen < history[idx].length) {
            offspring[idx][gen] += history[idx][gen];
          }
          mutatedOffspring.push(offspring[idx]);
        }
      } else if (fitnessValues[idx] > mean && Math.random() < 0.8) {
        if (history.length < offspring.length - 1) {
          offspring[idx][gen] += 1;
          temp[gen] = 1;
          history.push(temp);
          mutatedOffspring.push(offspring[idx]);
        } else {
          if (idx >= 0 && idx < history.length && gen >= 0 && gen < history[idx].length) {
            offspring[idx][gen] += history[idx][gen];
          }
          mutatedOffspring.push(offspring[idx]);
        }
      } else {
        mutatedOffspring.push(offspring[idx]);
      }

      if (idx >= 0 && idx < history.length && gen >= 0 && gen < history[idx].length) {
        if (fitnessCheck(mutatedOffspring[idx]) > fitnessValues[idx]) {
          history[idx][gen] *= -1;
        }
      }
    } else {
      mutatedOffspring.push(offspring[idx]);
    }
  }

  return mutatedOffspring;
}




function GeneticAlgorithm(encrypted){
    let population = []
    let bestIndividual = 0
    for(let i = 0; i < populationSize; i++){
        population.push(GenerateIndividual())
    }
    
    let generation = 0
    while(generation < 20){
        console.log(`\n\n------------------------Generation ${generation} ----------------------------`)
        console.log(`\npopulation : `)
        console.log(population)

        let fitnessValues = population.map(fitnessCheck)
        console.table(fitnessValues)

        let selectedParents = selection(population, fitnessValues);
        console.log(`\selectedParents : `)
        console.log(selectedParents)
        console.log(selectedParents.map(fitnessCheck))

        const offspring = crossover(selectedParents);
        console.log(`\offspring : `)
        console.log(offspring)
        console.log(offspring.map(fitnessCheck))

        // Mutation
        const mutatedOffspring = mutation(offspring);
        console.log(`\nmutatedOffspring : `)
        console.log(mutatedOffspring)
        console.log(mutatedOffspring.map(fitnessCheck))

        // Replace the population with the new generation
        population = mutatedOffspring;
        console.log(`new population : `)
        console.log(population)
        // if(mutatedOffspring.map(fitnessCheck).indexOf(0)){
        //   bestIndividual = mutatedOffspring[mutatedOffspring.map(fitnessCheck).indexOf(0)]
        //   break
        // }
        generation++;
    }


    return bestIndividual;
}


/**
 * 
 * !Main  
 */

function main(){
    // let configuration = GeneticAlgorithm()
    // let encrypt = enigmadecrypt([2,3,1],"Hello")
    // console.log(`\n\n"Hello" has been encrypted message to ${encrypt}`)
    // let decrypted = enigmadecrypt([2,3,1],encrypt)
    // console.log(`${encrypt} has been decrypted message to ${decrypted}\n\n`)
    const bestIndividual = GeneticAlgorithm();
    console.log(`rotor configuration : ${bestIndividual}`)
    console.log('Decrypted Message:', enigmadecrypt(bestIndividual, encryptedMessage));

}
main()