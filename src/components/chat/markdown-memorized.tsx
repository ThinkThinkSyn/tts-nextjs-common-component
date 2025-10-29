
import { FC, memo } from "react"
import ReactMarkdown from "react-markdown"

export interface MarkdownMemoizedProps {
	children: string;
	className?: string;
	remarkPlugins?: any[];
	components?: any;
}

export const MarkdownMemoized: FC<MarkdownMemoizedProps> = memo(
	({ children, className, remarkPlugins, components }) => {
		return (
			<div className={`${className} w-full max-w-full overflow-hidden`}>
				<ReactMarkdown
					remarkPlugins={remarkPlugins}
					components={components}
				>
					{children}
				</ReactMarkdown>
			</div>
		);
	}
);

MarkdownMemoized.displayName = "MarkdownMemoized";

