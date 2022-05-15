// https://www.apollographql.com/docs/react/data/subscriptions/

import { ApolloClient, InMemoryCache } from '@apollo/client'
import { split, HttpLink } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { gql } from 'graphql-tag'
const { LoremIpsum } = require('lorem-ipsum')

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
})

let token = lorem.generateWords(1)

const customFetch = (uri, options) => {
    options.headers.Authorization = `Bearer ${token}`;
    return fetch(uri, options);
}

const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch: customFetch
})

const wsLink = new GraphQLWsLink(createClient({
    url: 'ws://localhost:4000/subscriptions',
    connectionParams: {
        token: 'some-token',
    }
}))

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query)
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        )
    },
    wsLink,
    httpLink,
)

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
})

const style = document.createElement("style")
style.textContent = `
body {margin:20px;}
.post-container { padding:10px;background-color:red;margin-bottom:10px; }
.post-container-individual { padding:10px;background-color:green;margin-bottom:10px; }
`
document.head.appendChild(style)

const POSTS_PUBSUB_SUBSCRIPTION = gql`
subscription PostsPubSub { 
    postsPubSub {
        id
        body
    } 
}`

const POST_PUBSUB_WITH_ARG_SUBSCRIPTION = gql`
subscription PostPubSubWithArg($id:String!) { 
    postPubSubWithArg(id:$id) {
        id
        body
    } 
}`

const UPDATE_POST_MUTATION = gql`
mutation UpdatePost($id:String!, $body:String!) { 
    updatePost(id:$id, body:$body) {
        id
        body
    } 
}`

const POSTS_QUERY = gql`
query Posts { 
    posts {
        id
        body
    } 
}`

const POST_QUERY = gql`
query Post($id:String!) { 
    post(id:$id) {
        id
        body
    } 
}`

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function clearNode(node) {
    while (node.firstChild) {
        node.removeChild(node.lastChild);
    }
}

function updatePost(post) {
    return function () {
        const body = lorem.generateSentences(randomIntFromInterval(1, 6))
        client.mutate({
            mutation: UPDATE_POST_MUTATION,
            variables: { id: post.id, body }
        }).then((data) => {
            console.log(`mutated ${data.data.updatePost.id}`)
        }).catch(err => {
            console.log("catch", err)
        })
    }
}

async function fetchPosts() {
    const result = await client.query({
        query: POSTS_QUERY
    })
    return result.data.posts
}

async function fetchPost(id) {
    const result = await client.query({
        query: POST_QUERY,
        variables: { id }
    })
    return result.data.post
}

function showId(post) {
    const elementDiv = document.createElement('div')
    const elementAnchor = document.createElement('a')
    elementAnchor.onclick = updatePost(post)
    elementAnchor.href = '#'
    const textNodeAnchor = document.createTextNode(post.id)
    elementAnchor.appendChild(textNodeAnchor)
    elementDiv.appendChild(elementAnchor)
    return elementDiv
}

function showBody(post) {
    const elementDiv = document.createElement('div')
    const textNode = document.createTextNode(post.body)
    elementDiv.appendChild(textNode)
    return elementDiv
}

function showPost(post, className) {
    const elementDiv = document.createElement('div')
    elementDiv.className = className
    elementDiv.appendChild(showId(post))
    elementDiv.appendChild(showBody(post))
    return elementDiv
}

function showPosts(posts) {
    const elementDiv = document.createElement('div')
    posts.forEach(post => elementDiv.appendChild(showPost(post, 'post-container')))
    return elementDiv
}

async function subscribePosts() {
    const elementDiv = document.createElement('div')
    const posts = await fetchPosts()
    elementDiv.appendChild(showPosts(posts))
    posts.forEach(post => subscribePost(post.id))
    document.body.appendChild(elementDiv)
    client.subscribe({
        query: POSTS_PUBSUB_SUBSCRIPTION
    }).subscribe({
        next(data) {
            clearNode(elementDiv)
            elementDiv.appendChild(showPosts(data.data.postsPubSub))
        },
        error(err) { console.error('err', err) },
    })
}

async function subscribePost(id) {
    const elementDiv = document.createElement('div')
    const post = await fetchPost(id)
    elementDiv.appendChild(showPost(post, 'post-container-individual'))
    document.body.appendChild(elementDiv)
    client.subscribe({
        query: POST_PUBSUB_WITH_ARG_SUBSCRIPTION,
        variables: { id }
    }).subscribe({
        next(data) {
            clearNode(elementDiv)
            elementDiv.appendChild(showPost(data.data.postPubSubWithArg, 'post-container-individual'))
        },
        error(err) { console.error('err', err) },
    })
}

subscribePosts()