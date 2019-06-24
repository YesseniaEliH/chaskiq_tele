import React, {Component, createContext, Fragment} from 'react'
import axios from "axios"
import actioncable from "actioncable"
import {
  Route,
  Link
} from 'react-router-dom'
import styled from "styled-components"
import {ThemeProvider} from 'styled-components'
import gravatar from "gravatar"
import Moment from 'react-moment';
import Avatar from '@material-ui/core/Avatar';
import {soundManager} from 'soundmanager2'
import sanitizeHtml from 'sanitize-html';

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import {
  RowColumnContainer,
  ColumnContainer,
  GridElement,
  FixedHeader,
  HeaderTitle,
  ConversationButtons,
  Overflow
} from '../components/conversation/styles'

import graphql from "../graphql/client"
import { 
    CONVERSATIONS, 
    CONVERSATION, 
    APP_USER ,
    AGENTS
  } from "../graphql/queries"
import { 
  INSERT_COMMMENT, 
  ASSIGN_USER,
  INSERT_NOTE,
  UPDATE_CONVERSATION_STATE,
  TOGGLE_CONVERSATION_PRIORITY
} from '../graphql/mutations'

import Button from '@material-ui/core/Button'
import CheckIcon from '@material-ui/icons/Check'
import InboxIcon from '@material-ui/icons/Inbox'
import PriorityHighIcon from '@material-ui/icons/PriorityHigh'
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Drawer from '@material-ui/core/Drawer';
import SendIcon from '@material-ui/icons/Send'
import {Paper,Box, Typography} from '@material-ui/core'

import UserListItem from '../components/UserListItem'
import UserData from '../components/UserData'
import { camelCase, isEmpty } from 'lodash';


import Progress from '../shared/Progress'

import OptionMenu from '../components/conversation/optionMenu'
import FilterMenu from '../components/conversation/filterMenu'
import {last} from 'lodash'


import ConversationContainerShow from '../components/conversation/container'

import {
  getConversations, 
  updateConversationsData
} from '../actions/conversations'

import {
  getAppUser 
} from '../actions/app_user'


class MessageItem extends Component {
  render(){
    const user = this.props.conversation.mainParticipant
    return (
      <MessageContainer>

        <MessageControls/>

        <MessageHeader>
        
          <Avatar src={gravatar.url(user.email)} width={40} heigth={40}/>
          
          <MessageEmail>
            AAAAA {user.displayName}
          </MessageEmail>

          <Moment fromNow style={{ color: '#ccc', fontSize: '10px'}}>
            {this.props.message.created_at}
          </Moment>

        </MessageHeader>

        <MessageBody>

          {
            user.id != this.props.message.appUser.id ?
            <Avatar 
              src={gravatar.url(this.props.message.appUser.email)} 
              size={'xsmall'}
              style={{'float':'left'}}
            /> : null
          }  
              
          <span dangerouslySetInnerHTML={
            { __html: sanitizeHtml(this.props.message.message.htmlContent).substring(0, 250) }
          }/>
          
        </MessageBody>

      </MessageContainer>
    )
  }
}

class ConversationContainer extends Component {

  constructor(props){
    super(props)
    this.state = {
      conversation: {},
      rightDrawer: false,
    }
  }

  componentDidMount(){
    this.getConversations()
  }

  handleScroll = (e) => {
    let element = e.target

    //console.log(element.scrollHeight - element.scrollTop, element.clientHeight)
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      if (this.state.meta.next_page)
        this.getConversations({ append: true })
    }
  }

  getConversations = (cb)=>{
    this.props.dispatch(getConversations( ()=>{
      cb ? cb() : null
    }))
  }

  setSort = (option)=>{
    this.props.dispatch(updateConversationsData({sort: option}))
    this.setState({sort: option})
  }

  setFilter = (option)=>{
    this.props.dispatch(updateConversationsData({filter: option}))
  }

  showUserDrawer = (id)=>{
    this.setState({ rightDrawer: true }, ()=>{
      this.getUserData(id)
    });
  }

  getUserData = (id)=> {
    this.props.dispatch(getAppUser(id))
  }

  toggleDrawer = (side, open) => event => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    this.setState({rightDrawer: open });
  };

  filterButton = (handleClick)=>{
    return <Tooltip title="filter conversations">

        <Button
          aria-label="More"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          {/*<MoreVertIcon />*/}
          {this.props.conversations.filter}
        </Button>

       </Tooltip>
  }

  sortButton = (handleClick)=>{
    return <Tooltip title="sort conversations">
        <Button
          aria-label="More"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          {/*<MoreVertIcon />*/}
          {this.props.conversations.sort}
        </Button>

       </Tooltip>
  }

  filterConversations = (options, cb)=>{
    this.props.dispatch(
      updateConversationsData({filter: options.id}, ()=>{
        this.getConversations(cb)
      })
    )
  }

  sortConversations = (options, cb)=>{
    this.props.dispatch(
      updateConversationsData({sort: options.id}, ()=>{
        this.getConversations(cb)
      })
    )
  }

  setConversation = (conversation, cb)=>{
    this.setState({conversation: conversation}, cb)
  }


  render(){
    const {appId} = this.props.match.params

    return <RowColumnContainer>

            <Drawer 
              anchor="right" 
              open={this.state.rightDrawer} 
              onClose={this.toggleDrawer('right', false)}>
              
              {
                this.props.app_user ? 
                  <UserData width={ '300px'}
                    appUser={this.props.app_user} /> : null
              }

            </Drawer>

            <ColumnContainer>
              
              <GridElement>
                {/*<FixedHeader>Conversations</FixedHeader>*/}
                
                <FixedHeader style={{height: '82px'}}>
             
                  <HeaderTitle>
                    Conversations
                  </HeaderTitle>

                  <ConversationButtons>

                    <FilterMenu 
                      options={[
                        {id: "opened", name: "opened", count: 1, icon: <InboxIcon/> },
                        {id: "closed", name: "closed", count: 2, icon: <CheckIcon/>}
                      ]}
                      value={this.props.conversations.filter}
                      filterHandler={this.filterConversations}
                      triggerButton={this.filterButton}
                    />

                    <FilterMenu 
                      options={[
                        {id: "newest", name: "newest", count: 1, selected: true},
                        {id: "oldest", name: "oldest", count: 1},
                        {id: "waiting", name: "waiting", count: 1},
                        {id: "priority-first", name: "priority first", count: 1},
                      ]}
                      value={this.props.conversations.sort}
                      filterHandler={this.sortConversations}
                      triggerButton={this.sortButton}
                    />

                  </ConversationButtons>

                </FixedHeader>

                <Overflow onScroll={this.handleScroll}>


                  {
                    this.props.conversations.collection.map((o, i)=>{
                      const user = o.mainParticipant

                      return <div 
                                key={o.id} 
                                onClick={(e)=> this.props.history.push(`/apps/${appId}/conversations/${o.id}`) }>
                                        
                                <UserListItem
                                  value={this.state.conversation.id}
                                  mainUser={user}
                                  object={o.id}
                                  messageUser={o.lastMessage.appUser}
                                  showUserDrawer={this.showUserDrawer}
                                  messageObject={o.lastMessage}
                                  conversation={o}
                                  //createdAt={o.lastMessage.message.created_at}
                                  message={sanitizeHtml(o.lastMessage.message.htmlContent).substring(0, 250)}
                                />

                                {/*<MessageItem 
                                  conversation={o} 
                                  message={o.lastMessage}
                                />*/}
                              </div>
                    })
                  }

                  {this.props.conversations.loading ? 
                    <Progress/> 
                   : null }

                </Overflow>
              </GridElement>

              <Route exact path={`/apps/${appId}/conversations`}
                render={(props)=>(
                    <GridElement grow={2} style={{
                      display: 'flex', 
                      justifyContent: 'space-around'
                    }}>

                      <div style={{alignSelf: 'center'}}>
                        <Paper style={{padding: '2em'}}>
                             <Typography variant="h5" component="h3">
                                Conversations 
                              </Typography>

                              <Typography component="p">
                                Select a conversation or crate a new one
                              </Typography>

                        </Paper>
                      </div>

                      
                    </GridElement>
                )} />  
              

              <Route exact path={`/apps/${appId}/conversations/:id`} 
                  render={(props)=>(
                    <ConversationContainerShow
                      appId={appId}
                      app={this.props.app}
                      conversation={this.state.conversation}
                      setConversation={this.setConversation}
                      showUserDrawer={this.showUserDrawer}
                      currentUser={this.props.currentUser}
                      {...props}
                    />
                )} /> 

            </ColumnContainer>
          </RowColumnContainer>
  }
}

function mapStateToProps(state) {

  const { auth, app, conversations, app_user } = state
  const { loading, isAuthenticated } = auth
  //const { sort, filter, collection , meta, loading} = conversations

  return {
    conversations,
    app_user,
    app,
    isAuthenticated
  }
}

export default withRouter(connect(mapStateToProps)(ConversationContainer))