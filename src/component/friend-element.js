// load thumbnail instead of full image https://github.com/blueimp/JavaScript-Load-Image#demo

import { LitElement, html, css } from 'lit-element';
import { HelloAgent } from '../agents/hello-agent.js';

import data from "@solid/query-ldflex";

class FriendElement extends LitElement {

  static get properties() {
    return {
      name: {type: String},
      webId: {type: String},
      person: {type: Object}
    };
  }

  constructor() {
    super();
    this.webId = null
    this.person = {img:""}
  }

  static get styles() {
    //https://lit-element.readthedocs.io/en/v0.6.5/_guide/styles/
    return css`
    /* Selects the host element */
    :host{
      background-color: rgba(128, 255, 255, .5);
    }
    img{
      height:32px;
      width:32px;
      border-radius: 50%;
    }
    `;
  }

  render(){
    return html`
    <link href="css/fontawesome/css/all.css" rel="stylesheet">
    <link href="css/bootstrap/bootstrap.min.css" rel="stylesheet">

    <button type="button" class="btn btn-info"  @click="${this.details.bind(this)}">
    ${this.person.img.length > 0 ?
      html`
      <!-- REduce the profile image https://images.weserv.nl/docs/-->
      <img src="//images.weserv.nl/?url=${this.person.img}&w=32&h=32" title="${this.webId}" alt="Can not access image profile">
      <!--<img src="${this.person.img}" title="${this.webId}" alt="image">-->

      `
      :html`<i class="fas fa-user-circle fa-2x" title="${this.webId}"></i>`
    }

    <small>${this.person.name}</small>
    </button>
    `;
  }

  async firstUpdated(){
    var app = this;

    var p = {}
    if (this.webId != null){
      //https://github.com/solid/query-ldflex/blob/master/demo/user.html
      p.webId = `${this.webId}`
      //  console.log("###",p)
      const n = await data[this.webId].vcard$fn || p.webId.split("/")[2].split('.')[0];
      const img = await data[this.webId].vcard$hasPhoto || "";
      const inbox = await data[this.webId].inbox;
      const storage = await data[this.webId].storage;
      p.name = `${n}`
      p.img = `${img}`
      p.inbox = `${inbox}`
      p.storage = `${storage}`
      //  p.publicIndex = `${publicTypeIndex}`
      this.person = p
      const publicTypeIndex = await data[this.webId].publicTypeIndex || "undefined"
      //  console.log(`${publicTypeIndex}`);

      let instances = []
      try{
        if (`${publicTypeIndex}` != "undefined"){

          for await (const subject of data[publicTypeIndex].subjects){
            //  console.log(`${subject}`);
            if (`${publicTypeIndex}` != `${subject}`) {
              const s = {subject: `${subject}`}
              for await (const property of subject.properties)
              {
                if (`${property}` == "http://www.w3.org/ns/solid/terms#instance")    {
                  //  console.log( "--",`${property}`);
                  const instance = await data[subject][`${property}`]
                  const classe = await data[subject].solid$forClass
                  //  console.log( "--nn",`${instance}`);
                  s.predicate = `${property}`
                  s.object = `${instance}`
                  s.classe = `${classe}`
                }
              }
              instances.push(s)
            }
          }
        }
      }catch(e){
        console.log(e)
      }
      p.instances = instances
      this.person = p
      //  console.log(this.person)
    }



    this.agent = new HelloAgent(this.name);
    this.agent.receive = function(from, message) {

      if (message.hasOwnProperty("action")){
        switch(message.action) {
          case "info":
          app.addInfo(from, message)
          break;
          default:
          console.log("Unknown action ",message)
        }
      }
    };

  }

  details(e){
    console.log( this.person.webId, this.person.instances)
    //  console.log(await data[this.webId])
    this.agent.send("Messages", {action:"info", info: this.person})
    this.agent.send("Flow", {action:"personChanged", person: this.person})
  }

}

customElements.define('friend-element', FriendElement);
