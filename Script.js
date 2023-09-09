'use strict'

let list=document.querySelector(".list");
let formContainer=document.querySelector(".form-container");
let form=document.querySelector(".form");
let inputDistance=document.querySelector(".input-distance");
let inputCadence=document.querySelector(".input-cadence");
let inputDuration=document.querySelector(".input-duration");
let inputElevation=document.querySelector(".input-elevation");
let inputType=document.querySelector(".input-type");
let walkingColThird=document.querySelector(".third-collumn");
let cyclingColThird=document.querySelector(".third-collumn-cycling");
let walkingColFourth=document.querySelector(".fourth-collumn");
let sidebar=document.querySelector(".sidebar");

class Workout{
    date=new Date();
    id =(Date.now()+"").slice(-10);


    constructor(coords,distance,duration) {
        this.coords=coords;   //[lat,lng]
        this.distance=distance;
        this.duration=duration;

    }



    _setDescription(){
    const months=['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`

    }

}

class Running extends Workout{
     type="running"
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence=cadence;
        this.calcPace();
        this._setDescription();

    }
    calcPace(){
        // min/km
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type="cycling"
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain=elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed=this.distance/(this.duration/60);
        return this.speed;
    }


}

const run1=new Running([39,-12],5.2,24,178)
const cycling1=new Cycling([39,-12],27,95,523)
console.log(run1,cycling1);

//////////////////////////////////////////////////////////////////////////////

//APPLICATION ARHITECTHURE

class App{
    #map;
    #mapEvent;
    #workouts=[];

    constructor() {
        this._getPosition();

        form.addEventListener("submit",this._newWorkout.bind(this));

        inputType.addEventListener("change",this._toggleElevationField.bind(this))

        sidebar.addEventListener("click",this._moveToPopup.bind(this));

        this._getLocalStorage();


    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                alert("Couldn't load the map");
            })
        }
    }

    _loadMap(position)
    {

            const {latitude} =position.coords;
            const {longitude}=position.coords;
            const coords=[latitude,longitude];
            this.#map = L.map('map').setView(coords, 13);

            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on("click",this._showForm.bind(this));
        this.#workouts.forEach(work=>{
            this.renderWorkoutMarker(work);

        })

    }

    _showForm(mapE){
        this.#mapEvent=mapE;
        formContainer.classList.remove("hidden");
        inputDistance.focus();
    }

    _newWorkout(e){

       const validInputs= (...inputs) => inputs.every(inp => Number.isFinite(inp));

       const allPositive=(...inputs) => inputs.every( inp => {
           console.log(inp)
           return inp > 0
       });




        e.preventDefault();

        //get data from form
         let type=inputType.value;
         let distance=Number(inputDistance.value);
         console.log(distance);
         let duration=Number(inputDuration.value);
        const{lat,lng}=this.#mapEvent.latlng;
        let workout;




        //if workout running, create running object
           if(type==="running"){
               let cadence=Number(inputCadence.value);
               //Check if data is valid
               if(!validInputs(distance,duration,cadence) || !allPositive(distance,duration,cadence)){
                   return alert("Inputs have to be positive numbers!")
               }


                workout=new Running([lat,lng],distance, duration, cadence);

           }
        //if workout cycling, create cycling object
           if(type==="cycling"){
               let elevation=Number(inputElevation.value);

              //console.log(distance)


           if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration)){
               return alert("Inputs have to be positive numbers!")
           }
               workout=new Cycling([lat,lng] ,distance,duration, elevation);

        }



        //add new object to workout array

          this.#workouts.push(workout);

        //render workout on map as marker
        this.renderWorkoutMarker(workout);

        //render workout on list
        this._renderWorkout(workout);

        //clear input fields + Hide form
        inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value="";
        formContainer.style.display="none";
        formContainer.classList.toggle("hidden")
       // formContainer.style.display="grid";
        setTimeout(()=>formContainer.style.display="grid",1000);

       //set local storage to all workouts
        this._setLocalStorage();



    }


    renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth:350,
                minWidth:100,
                autoClose:false,
                closeOnClick:false,
                className:`${workout.type}-popup`
            })).setPopupContent(`${workout.type==="running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
            .openPopup();
    }

    _toggleElevationField(){
        cyclingColThird.classList.toggle("hidden");
        walkingColThird.classList.toggle("hidden");
       // inputElevation.closest(".col").classList.toggle("hidden")
       // inputCadence.closest(".col").classList.toggle("hidden")
        inputElevation.classList.toggle("hidden-input")
        inputCadence.classList.toggle("hidden-input")
    }

    _renderWorkout(workout){
        let html;
        if(workout.type==="running")
        {
            html=`<li class="workout workout-${workout.type}" data-id="${workout.id}">
          <h2 class="workout_title">${workout.description}</h2>
          <div class="workout_details">
            <span class="workout_icon">${workout.type==="running" ? "🏃‍♂️" : "🚴‍♀️"}️</span>
            <span class="workout_value">${workout.distance}</span>
            <span class="workout_unit">km</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">⏱</span>
            <span class="workout_value">${workout.duration}</span>
            <span class="workout_unit">min</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">⚡️</span>
            <span class="workout_value">${workout.pace}</span>
            <span class="workout_unit">min/km</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">🦶🏼</span>
            <span class="workout_value">${workout.cadence}</span>
            <span class="workout_unit">spm</span>
          </div>
        </li> `;
        }

        else
        {
            html=`<li class="workout workout-${workout.type}" data-id="${workout.id}">
          <h2 class="workout_title">${workout.description}</h2>
          <div class="workout_details">
            <span class="workout_icon">${workout.type==="running" ? "🏃‍♂️" : "🚴‍♀️"}️</span>
            <span class="workout_value">${workout.distance}</span>
            <span class="workout_unit">km</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">⏱</span>
            <span class="workout_value">${workout.duration}</span>
            <span class="workout_unit">min</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">⚡️</span>
            <span class="workout_value">${workout.speed}</span>
            <span class="workout_unit">min/km</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">🗻</span>
            <span class="workout_value">${workout.elevationGain}</span>
            <span class="workout_unit">m</span>
          </div>
           </li>`;
        }

        formContainer.insertAdjacentHTML("afterend", html);
    }

    _moveToPopup(e){
        const workoutEl=e.target.closest(".workout");
       //console.log(workoutEl)
        if(!workoutEl)
        {
            return;
        }

        const workout=this.#workouts.find(work=>work.id === workoutEl.dataset.id);
        //console.log(workout)

        this.#map.setView(workout.coords,13,{
            animate:true,
            pan:{
                duration:1
            }
        });
    }


    _setLocalStorage()
    {
        localStorage.setItem("workouts",JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem("workouts"));
        if(!data)
        {
            return;
        }

        this.#workouts=data;
        this.#workouts.forEach(work=>{
            this._renderWorkout(work)
           //markersot mora vo loadmap da se renderiraat za da bide prvo loadnata mapata
        })

    }


    reset()
    {
        localStorage.removeItem("workouts");

    }

}

const app=new App();
app.reset();


