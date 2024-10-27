import { useContext, useCallback, useEffect, useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { BeautifulMentionsPlugin, BeautifulMentionNode } from "lexical-beautiful-mentions";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { Provider } from "@lexical/yjs";
import { PoolContext } from "@/main";
import { Home } from "@/models/home";
import { observer } from "mobx-react";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode } from "@lexical/rich-text";
import { $getRoot, $createParagraphNode } from "lexical";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin"; // We'll create this file next

// Helper functions for base64 encoding/decoding
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, uint8Array as unknown as number[]));
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const TripBlog = observer(() => {
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const currentUser = home.members.find((x) => x.name === "Paul Bardea");
    const trip = currentUser?.trips.items[0]; // Assuming we're editing the first trip

    const mentionItems = {
        "@": trip?.cities.map(city => city.name) || [],
        "#": trip?.attractions.map(attraction => attraction.name) || [],
    };

    const yDoc = useMemo(() => new Y.Doc(), []);
    const yText = yDoc.getText('tripBlog');

    useEffect(() => {
        if (trip && trip.guide) {
            console.log("Loaded guide:", trip.guide);
            try {
                const update = base64ToUint8Array(trip.guide);
                Y.applyUpdate(yDoc, update);
                console.log("Applied update, yText content:", yText.toString());
            } catch (error) {
                console.error("Failed to load guide:", error);
            }
        } else {
            console.log("No guide data found");
        }
    }, [trip, yDoc, yText]);

    const initialConfig = {
        namespace: 'TripBlog',
        nodes: [HeadingNode, BeautifulMentionNode], // Add HeadingNode here
        onError: (error: Error) => {
            console.error(error);
        },
        editorState: null,
    };

    const providerFactory = useCallback((id: string, yjsDocMap: Map<string, Y.Doc>) => {
        yjsDocMap.set(id, yDoc);
        return new WebsocketProvider('ws://localhost:1235', id, yDoc);
    }, [yDoc]);

    const EditorStateManager = () => {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
            const updateEditorState = () => {
                const yTextContent = yText.toString();
                if (yTextContent) {
                    try {
                        // Try to parse the Yjs content
                        const editorState = editor.parseEditorState(yTextContent);
                        editor.setEditorState(editorState);
                    } catch (error) {
                        console.error("Failed to parse Yjs content:", error);
                        // If parsing fails, create a new empty editor state
                        editor.update(() => {
                            const root = $getRoot();
                            root.clear();
                            root.append($createParagraphNode());
                        });
                    }
                } else {
                    // If there's no content, create a new empty editor state
                    editor.update(() => {
                        const root = $getRoot();
                        root.clear();
                        root.append($createParagraphNode());
                    });
                }
            };

            updateEditorState();

            const observer = () => {
                updateEditorState();
            };

            yText.observe(observer);

            return () => {
                yText.unobserve(observer);
            };
        }, [editor]);

        return null;
    };

    return (
        <div className="trip-blog">
            <h2>{trip?.name} Blog</h2>
            <LexicalComposer initialConfig={initialConfig}>
                <div className="editor-container">
                    <ToolbarPlugin /> {/* Add the ToolbarPlugin here */}
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={<div className="editor-placeholder">Start writing about your trip...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <BeautifulMentionsPlugin
                        items={mentionItems}
                        triggers={["@", "#"]}
                    />
                    <CollaborationPlugin
                        id={`trip-${trip?.id}-blog`}
                        providerFactory={(id, yjsDocMap) => {
                            const provider = providerFactory(id, yjsDocMap);
                            // Extend the awareness.getLocalState() method
                            const originalGetLocalState = provider.awareness.getLocalState.bind(provider.awareness);
                            provider.awareness.getLocalState = () => {
                                const state = originalGetLocalState();
                                return state ? {
                                    ...state,
                                    anchorPos: null,
                                    color: null,
                                    focusing: null,
                                    focusPos: null,
                                    // Add any other required properties
                                } : null;
                            };
                            return provider as unknown as Provider;
                        }}
                        shouldBootstrap={true}
                    />
                    <OnChangePlugin onChange={() => {
                        if (trip) {
                            try {
                                const update = Y.encodeStateAsUpdate(yDoc);
                                const base64Update = uint8ArrayToBase64(update);
                                console.log("Saving guide:", base64Update);
                                trip.guide = base64Update;
                                trip.save();
                            } catch (error) {
                                console.error("Failed to save guide:", error);
                            }
                        }
                    }} />
                    <EditorStateManager />
                </div>
            </LexicalComposer>
        </div>
    );
});

export default TripBlog;
