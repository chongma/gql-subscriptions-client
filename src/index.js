import { ApolloClient, InMemoryCache } from '@apollo/client'
import { split, HttpLink, useSubscription } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { gql } from 'graphql-tag'

const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql'
})

const wsLink = new GraphQLWsLink(createClient({
    url: 'ws://localhost:4000/subscriptions',
    connectionParams: {
        authToken: 'some-token',
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

const POSTS_SUBSCRIPTION = gql`
subscription { somethingOld {id,body} }
`

client.subscribe({
    query: POSTS_SUBSCRIPTION
}).subscribe({
    next(data) {
        console.log(data)
        alert(data.data.somethingOld.length)
    },
    error(err) { console.error('err', err); },
});