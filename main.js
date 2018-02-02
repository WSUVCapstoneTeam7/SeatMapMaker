/*jshint esversion: 6 */
const fabCanvas = new fabric.Canvas('c');

fabCanvas.setWidth( window.innerWidth );
fabCanvas.setHeight( window.innerHeight);


var bus = new Vue();


Vue.component('add-form',{
    template: '#add-form',
    data(){
        return{
            sectionName: "test name",
            columns: 5,
            rows: 5,
            showAddSeatForm: false,
        };
    },
    methods:{
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitSeatingData(){
            console.log("submit seat data");
            // emit a Make Seating bus signal; or place a passenger on the bus carrying the 
            // parameters to make a seating section. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            bus.$emit('sigMakeSeating',100,100,this.columns, this.rows, this.sectionName);

            // set toggle the seating forms visibility since the seating section has been created.
            this.showAddSeatForm = false;
        }
    },
    // function that launches when Forms component is created
    // signal listeners must be initialized on component creation
    created(){
        // a "bus stop" signal listener for toggling the visibility of the add seating form.
        bus.$on('sigAddSeatFormOn', ()=>{
            this.showAddSeatForm = true;
        });
        // a bus listener for toggling the visibility of both forms when 
        // the delete seating signal is received.
        bus.$on('sigAddSeatFormOff',()=>{
            this.showAddSeatForm = false;
        });
    }, 
});

Vue.component('edit-form',{
    template: '#edit-form',
    data(){
        return {
            name: "defaultName",
            rows: 5,
            cols: 5,
            posX: 100,
            posY: 100,
            showEditSeatingForm: false
        };
    },
    methods:{
        submitEditSeating(){
            console.log(fabCanvas.getActiveObject())
            console.log(fabCanvas.getActiveObject().calcCoords())
            if (fabCanvas.getActiveObject() != null) {
                var coords = fabCanvas.getActiveObject().calcCoords()
                vm.deleteSeating()
                vm.makeSeating(coords.tl.x, coords.tl.y, this.cols, this.rows, this.name)    
            }
        }
    },
    created(){
        // a bus listener for toggling visibility of the the edit seating form.
        bus.$on('sigEditSeatFormOn', ()=>{
            this.showEditSeatingForm = true;
        });
        bus.$on('sigEditSeatFormOff',()=>{
            this.showEditSeatingForm = false;
        });
    }
});

Vue.component('drop-down-menu',{
    template: '#drop-down-menu',
    data(){
        return {};
    },
    methods:{
        preventDropmenuClosing(e){
            $('.dropdown-menu').on('click', (e)=> {
                // console.log(e);
                // console.log('stopped');
                e.stopPropagation();
            });
        },
        downloadStuff(){
            var fileName = "seat-map.json";
            var jsonString = JSON.stringify(fabCanvas);    

            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));
            element.setAttribute('download', fileName);
        
            element.style.display = 'none';
            document.body.appendChild(element);
        
            element.click();
        
            document.body.removeChild(element);
        },
        setAddSeating(){ 
            // emits a bus signal to toggle the add seating form.
            bus.$emit('sigAddSeatFormOn');
            bus.$emit('sigEditSeatFormOff');
        },
        setDeleteSeating(){
            // emits a bus signal to toggle both forms off
            bus.$emit('sigAddSeatFormOff');
            bus.$emit('sigEditSeatFormOff');
            // signal the seating to be deleted
            bus.$emit('sigDeleteSeating');
        },
        setEditTool(){
            // emits a bus signal to toggle the edit seating form
            bus.$emit('sigEditSeatFormOn');
            bus.$emit('sigAddSeatFormOff');
        },
    }
});


var vm = new Vue({
    el:'#vue-app',
    data:{
        mapData: {},
    },
    methods:{
         //  makes the seating sections
        makeSeating:function(posX, posY, cols, rows, name) {
            var rad = 10,
            dia = rad*2,
            gap = 5,
            sideBuff = 10,
            topBuff = 10,
            bottomBuff = 10,
            sizeX = sideBuff*2 + cols*dia + (cols-1)*gap,
            sizeY = topBuff + bottomBuff + rows*dia + (rows-1)*gap;
    
            var items = [];
    
            var container = new fabric.Rect({
            left: posX,
            top: posY,
            originX: 'left',
            originY: 'top',
            stroke: 'black',
            fill: 'transparent',
            width: sizeX,
            height: sizeY,
            });
    
            var text = new fabric.IText(name, {
            fontSize: 20,
            fontFamily: 'sans-serif',
            left: (posX+(sizeX/2)),
            top: (posY+10),
            originX: 'center', 
            originY: 'top',
            hasControls: false	
            });
    
            // resize container to accomodate text (maybe just make text box first?)
            container.setHeight(topBuff*2 + text.height + bottomBuff + rows*dia + (rows-1)*gap);
    
            items.push(container);
            items.push(text);
    
            for (var i=0; i < rows; i++) {
            for (var j=0; j < cols; j++) {
                console.log("adding circle");
                var circle = new fabric.Circle({
                radius: rad, 
                fill: 'green', 
                left: posX, 
                top: posY,
                left: (posX + sideBuff) + rad + j*dia + j*gap, 
                top: (text.top + text.height + topBuff) + rad + i*dia + i*gap,
                originX: 'center',
                originY: 'center'
                });
                items.push(circle);
            }
            }
            var group = new fabric.Group(items, {
            lockScalingX: true,
            lockScalingY: true	
            });
            // this.seatArray.push(group);
            fabCanvas.add(group);
            fabCanvas.renderAll();
            // SEE BELOW LINE: how to attach functions to act on objects given a certain event
        /*	group.on('mousedown', fabricDblClick(group, function (obj) {
            ungroup(group);
            canvas.setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            })); */
            // SEE OLD CODE: "Double-click text editing" for full code
        
        },
        // removes the currently selected Seat Selection from the fabCanvas.
        deleteSeating:function(){
            // gets the currently active square
            var seatingToDelete = fabCanvas.getActiveObject();
            console.log("This is Rect to Delete From Fabric: "+seatingToDelete);
            fabCanvas.remove(seatingToDelete);
            fabCanvas.renderAll();
        },
    },
    created(){
        // listens for a signal saying to create a new seating section
        bus.$on('sigMakeSeating', (posX, posY, cols, rows, name)=>{
            console.log(fabCanvas);
            this.makeSeating(posX, posY, cols, rows, name);

        });

        // listens for a signal saying to delete the seating
        bus.$on('sigDeleteSeating', ()=>{
            this.deleteSeating();
        });

        // loads a canvas instance from the data store in seat-map.json
        $.getJSON( "./seat-map.json", function( data ) {
            fabCanvas.loadFromJSON(data);
          });
    }
});
